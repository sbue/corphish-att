package com.sbue.corphish.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "location_samples")
data class LocationSampleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val tsMs: Long,
    val lat: Double,
    val lon: Double,
    val accuracyM: Float
)
