package com.sbue.corphish.network

import android.util.Log
import com.sbue.corphish.AppConfig
import com.sbue.corphish.data.LocationRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

class LocationUploader(
    private val repository: LocationRepository,
    private val httpClient: OkHttpClient
) {
    private var lastBatchSize = 0

    private suspend fun uploadBatch(): UploadOutcome {
        val batch = repository.getOldestBatch(AppConfig.UPLOAD_BATCH_SIZE)
        lastBatchSize = batch.size

        if (batch.isEmpty()) {
            Log.d(AppConfig.LOG_TAG, "Upload skipped: queue is empty.")
            return UploadOutcome.NO_DATA
        }
        if (AppConfig.API_KEY.isBlank()) {
            Log.w(AppConfig.LOG_TAG, "Upload skipped: LOCATION_METRICS_WEBHOOK_KEY missing in build config.")
            return UploadOutcome.RETRY
        }

        val payload = JSONArray()
        batch.forEach { sample ->
            payload.put(
                JSONObject()
                    .put("tsMs", sample.tsMs)
                    .put("lat", sample.lat)
                    .put("lon", sample.lon)
                    .put("accuracyM", sample.accuracyM)
            )
        }

        val requestBody = payload.toString()
            .toRequestBody("application/json; charset=utf-8".toMediaType())
        val request = Request.Builder()
            .url(AppConfig.API_URL)
            .header(AppConfig.LOCATION_METRICS_KEY_HEADER, AppConfig.API_KEY)
            .post(requestBody)
            .build()

        return try {
            val response = withContext(Dispatchers.IO) {
                httpClient.newCall(request).execute()
            }
            response.use { http ->
                if (http.isSuccessful) {
                    repository.deleteByIds(batch.map { it.id })
                    Log.d(AppConfig.LOG_TAG, "Uploaded $lastBatchSize locations.")
                    UploadOutcome.SUCCESS
                } else {
                    Log.w(AppConfig.LOG_TAG, "Upload failed: ${http.code}")
                    UploadOutcome.RETRY
                }
            }
        } catch (exception: Exception) {
            Log.w(AppConfig.LOG_TAG, "Upload error.", exception)
            UploadOutcome.RETRY
        }
    }

    suspend fun uploadAll(): UploadSummary {
        var uploaded = 0
        while (true) {
            when (uploadBatch()) {
                UploadOutcome.NO_DATA -> {
                    return if (uploaded == 0) {
                        UploadSummary(0, UploadStatus.NO_DATA)
                    } else {
                        UploadSummary(uploaded, UploadStatus.SUCCESS)
                    }
                }
                UploadOutcome.SUCCESS -> {
                    uploaded += lastBatchSize
                }
                UploadOutcome.RETRY -> return UploadSummary(uploaded, UploadStatus.RETRY)
            }
        }
    }
}

enum class UploadOutcome {
    NO_DATA,
    SUCCESS,
    RETRY
}

data class UploadSummary(val uploadedCount: Int, val status: UploadStatus)

enum class UploadStatus {
    NO_DATA,
    SUCCESS,
    RETRY
}
