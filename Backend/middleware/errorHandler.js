export function errorHandler(err, req, res, next){
    // Log completo siempre — visible en Vercel Logs
    console.error('[ERROR]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    })

    const status = err.status || err.statusCode || 500;
    const isClientError = status >= 400 && status < 500;

    res.status(status).json({
        message: isClientError ? err.message : 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
}