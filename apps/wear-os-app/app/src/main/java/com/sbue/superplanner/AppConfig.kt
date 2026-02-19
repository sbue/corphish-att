package com.sbue.superplanner

object AppConfig {
    const val MAX_QUEUE_SIZE = 100
    const val UPLOAD_BATCH_SIZE = 50
    const val CAPTURE_INTERVAL_MS = 60_000L
    const val UPLOAD_PERIOD_MINUTES = 15L
    const val UPLOAD_PERIODIC_WORK_NAME = "upload_locations_periodic"
    const val UPLOAD_WORK_NAME = "upload_locations"
    const val API_URL = "https://webhook.site/28531cc4-c1c6-4b76-ba9f-fa9a600d69fb"
    const val LOG_TAG = "SuperPlanner"
}
