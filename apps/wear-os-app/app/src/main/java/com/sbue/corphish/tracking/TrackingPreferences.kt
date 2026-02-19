package com.sbue.corphish.tracking

import android.content.Context

object TrackingPreferences {
    private const val PREFS_NAME = "tracking_prefs"
    private const val KEY_TRACKING_ENABLED = "tracking_enabled"

    fun isTrackingEnabled(context: Context): Boolean {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getBoolean(KEY_TRACKING_ENABLED, false)
    }

    fun setTrackingEnabled(context: Context, enabled: Boolean) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_TRACKING_ENABLED, enabled)
            .apply()
    }
}

