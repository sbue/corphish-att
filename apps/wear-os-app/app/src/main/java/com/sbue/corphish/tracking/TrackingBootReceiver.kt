package com.sbue.corphish.tracking

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.sbue.corphish.work.TrackingScheduler

class TrackingBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val shouldStart = action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        if (!shouldStart) {
            return
        }

        if (!TrackingPreferences.isTrackingEnabled(context)) {
            return
        }

        TrackingScheduler.schedulePeriodicUpload(context)
        LocationTrackingService.start(context)
    }
}

