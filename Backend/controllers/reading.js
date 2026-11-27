import { ReadingModel } from '../models/reading.js'
import { ValidateReadingLog } from '../schemas/reading.js'

export class ReadingController {
  static async getTracker(req, res, next) {
    try {
      const userData = req.session.user
      const tracker = await ReadingModel.getTrackerState({ user_id: userData.id })
      return res.status(200).json(tracker)
    } catch (e) {
      next(e)
    }
  }

  static async logPages(req, res, next) {
    try {
      const parsed = ValidateReadingLog(req.body)
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid reading log data' })
      }

      const userData = req.session.user
      const result = await ReadingModel.logPages({
        user_id: userData.id,
        input: parsed.data,
      })

      if (result.notFound) {
        return res.status(404).json({ message: 'Book not found' })
      }

      if (result.pagesDelta <= 0) {
        return res.status(200).json(result)
      }

      return res.status(201).json(result)
    } catch (e) {
      next(e)
    }
  }
}
