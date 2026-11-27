import { ValidateChat } from "../schemas/ai.js";
import { createAiChatStream } from "../services/ai.service.js";

function mapAiErrorResponse(error) {
    const status = Number(error?.status);

    if (error?.code === 'AI_NOT_CONFIGURED' || error?.code === 'AI_AUTH_ERROR') {
        return {
            status: 503,
            error: 'El asistente de IA no está disponible en este momento. Intentá más tarde.',
        };
    }

    if (status === 429) {
        return {
            status: 429,
            error: 'El asistente alcanzó el límite temporal de consultas. Esperá unos segundos e intentá nuevamente.',
        };
    }

    if (status === 504 || error?.code === 'AI_TIMEOUT') {
        return {
            status: 504,
            error: 'El asistente tardó demasiado en responder. Intentá nuevamente.',
        };
    }

    if (status === 503 || status === 502) {
        return {
            status: 503,
            error: 'Lib está recibiendo muchas consultas en este momento. Intentá nuevamente en unos segundos.',
        };
    }

    return {
        status: 500,
        error: 'No pudimos generar una respuesta en este momento. Intentá nuevamente.',
    };
}

export class AiController {
    static async aiChat(req, res) {
        const result = ValidateChat(req.body);
        if (!result.success) {
            const firstIssue = result.error?.issues?.[0]?.message;
            return res.status(400).json({
                error: firstIssue || 'Datos inválidos para el chat.',
            });
        }

        const { message, history = [] } = result.data;
        const abortController = new AbortController();

        const handleClose = () => {
            if (!res.writableEnded) {
                abortController.abort();
            }
        };
        res.on('close', handleClose);

        try {
            const { stream } = await createAiChatStream({
                message,
                history,
                signal: abortController.signal,
            });

            if (abortController.signal.aborted || res.writableEnded) {
                return;
            }

            // Confirmamos el stream recién cuando el primer chunk válido llegó desde Gemini
            // No enviamos Transfer-Encoding manual para evitar conflictos HTTP/2 en Vercel
            res.status(200);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('X-Accel-Buffering', 'no');
            res.flushHeaders?.();

            for await (const text of stream) {
                if (abortController.signal.aborted || res.writableEnded) {
                    break;
                }
                if (text) {
                    res.write(text);
                }
            }

            if (!res.writableEnded) {
                res.end();
            }
        } catch (error) {
            if (abortController.signal.aborted && error?.name === 'AbortError') {
                if (!res.writableEnded) res.end();
                return;
            }

            console.error('[AiController] Error generando respuesta:', {
                status: error?.status,
                code: error?.code,
                message: error?.message,
            });

            if (!res.headersSent) {
                const { status, error: errorMessage } = mapAiErrorResponse(error);
                res.status(status).json({ error: errorMessage });
            } else if (!res.writableEnded) {
                res.end();
            }
        } finally {
            res.off('close', handleClose);
        }
    }
}
