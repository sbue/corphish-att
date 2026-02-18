package com.sbue.superplanner.work

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.sbue.superplanner.AppConfig
import com.sbue.superplanner.location.LocationCapture

class CaptureLocationWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        LocationCapture(applicationContext).captureOnce(enqueueUpload = true)
        return Result.success()
    }
}
