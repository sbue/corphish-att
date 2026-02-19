package com.sbue.corphish

object AppConfig {
    const val MAX_QUEUE_SIZE = 100
    const val UPLOAD_BATCH_SIZE = 50
    const val CAPTURE_INTERVAL_MS = 60_000L
    const val UPLOAD_PERIODIC_WORK_NAME = "upload_locations_periodic"
    const val UPLOAD_WORK_NAME = "upload_locations"
    const val LOCATION_METRICS_KEY_HEADER = "x-location-metrics-key"
    val API_URL: String = BuildConfig.LOCATION_METRICS_API_URL
    val API_KEY: String = BuildConfig.LOCATION_METRICS_WEBHOOK_KEY
    const val LOG_TAG = "SuperPlanner"
}
