package com.sbue.superplanner.presentation

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Switch
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import androidx.wear.compose.material.ToggleChip
import androidx.wear.compose.material.ToggleChipDefaults
import androidx.wear.compose.material.rememberScalingLazyListState
import androidx.wear.compose.material.ScalingLazyColumn
import androidx.wear.tooling.preview.devices.WearDevices
import com.sbue.superplanner.presentation.theme.SuperPlannerTheme
import java.text.DateFormat
import java.util.Date

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()

        super.onCreate(savedInstanceState)

        setTheme(android.R.style.Theme_DeviceDefault)

        setContent {
            WearApp()
        }
    }
}

@Composable
fun WearApp() {
    SuperPlannerTheme {
        TrackingScreen()
    }
}

@Composable
fun TrackingScreen(viewModel: TrackingViewModel = viewModel()) {
    val context = LocalContext.current
    val queueCount by viewModel.queueCount.collectAsState()
    val lastCaptureTs by viewModel.lastCaptureTs.collectAsState()
    val trackingEnabled by viewModel.trackingEnabled.collectAsState()
    val status by viewModel.status.collectAsState()
    var showConfig by rememberSaveable { mutableStateOf(false) }

    var foregroundGranted by remember { mutableStateOf(hasForegroundLocationPermission(context)) }
    var backgroundGranted by remember { mutableStateOf(hasBackgroundLocationPermission(context)) }
    var pendingEnable by remember { mutableStateOf(false) }
    val requiresBackground = remember { Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q }

    val vibrator = remember { context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator }

    val backgroundPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        backgroundGranted = granted
        if (pendingEnable && (!requiresBackground || backgroundGranted)) {
            viewModel.setTrackingEnabled(true)
        }
        if (!granted) {
            viewModel.updateStatus("Background location permission denied.", isError = true)
        }
        pendingEnable = false
    }

    val foregroundPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        foregroundGranted = results.values.any { it }
        if (pendingEnable && foregroundGranted) {
            if (requiresBackground && !backgroundGranted) {
                backgroundPermissionLauncher.launch(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
            } else {
                viewModel.setTrackingEnabled(true)
                pendingEnable = false
            }
        } else if (pendingEnable && !foregroundGranted) {
            viewModel.updateStatus("Location permission denied.", isError = true)
            pendingEnable = false
        }
    }

    LaunchedEffect(Unit) {
        foregroundGranted = hasForegroundLocationPermission(context)
        backgroundGranted = hasBackgroundLocationPermission(context)
    }

    val lastCaptureText = lastCaptureTs?.let {
        val formatter = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
        formatter.format(Date(it))
    } ?: "--"

    LaunchedEffect(status) {
        val current = status ?: return@LaunchedEffect
        if (vibrator == null) return@LaunchedEffect
        if (current.isError) {
            vibratePattern(vibrator, longArrayOf(0, 60, 40, 60))
        } else {
            vibratePattern(vibrator, longArrayOf(0, 40))
        }
    }

    Scaffold(
        timeText = { TimeText() }
    ) {
        val listState = rememberScalingLazyListState()
        ScalingLazyColumn(
            modifier = Modifier.fillMaxSize(),
            state = listState,
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (showConfig) {
                item {
                    ToggleChip(
                        checked = trackingEnabled,
                        onCheckedChange = { checked ->
                            if (checked && !foregroundGranted) {
                                pendingEnable = true
                                foregroundPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            } else if (checked && requiresBackground && !backgroundGranted) {
                                pendingEnable = true
                                backgroundPermissionLauncher.launch(
                                    Manifest.permission.ACCESS_BACKGROUND_LOCATION
                                )
                            } else {
                                viewModel.setTrackingEnabled(checked)
                            }
                        },
                        label = { Text("Tracking") },
                        toggleControl = {
                            Switch(
                                checked = trackingEnabled,
                                enabled = foregroundGranted &&
                                    (!requiresBackground || backgroundGranted)
                            )
                        },
                        colors = ToggleChipDefaults.toggleChipColors(
                            checkedToggleControlColor = MaterialTheme.colors.primary
                        )
                    )
                }
                item {
                    Chip(
                        onClick = {
                            runCatching {
                                context.startActivity(
                                    android.content.Intent(
                                        Settings.ACTION_LOCATION_SOURCE_SETTINGS
                                    ).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                                )
                            }.onFailure {
                                viewModel.updateStatus(
                                    "Unable to open location settings.",
                                    isError = true
                                )
                            }
                        },
                        label = { Text("Open Location Settings") },
                        colors = ChipDefaults.secondaryChipColors()
                    )
                }
                item {
                    Text("Queue size: $queueCount")
                }
                item {
                    Text("Last capture: $lastCaptureText")
                }
                status?.let { state ->
                    item {
                        Text(
                            "Status: ${state.message}",
                            color = if (state.isError) {
                                MaterialTheme.colors.error
                            } else {
                                MaterialTheme.colors.onSurface
                            }
                        )
                    }
                }
                if (!foregroundGranted) {
                    item {
                        Text("Location permission required.")
                    }
                } else if (requiresBackground && !backgroundGranted) {
                    item {
                        Text("Background location required for tracking.")
                    }
                }
                item {
                    Chip(
                        onClick = { showConfig = false },
                        label = { Text("Back") },
                        colors = ChipDefaults.primaryChipColors()
                    )
                }
            } else {
                item {
                    Chip(
                        onClick = {
                            if (foregroundGranted) {
                                viewModel.captureNow()
                            } else {
                                pendingEnable = false
                                foregroundPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        label = { Text("Capture Now") },
                        colors = ChipDefaults.primaryChipColors()
                    )
                }
                item {
                    Chip(
                        onClick = { viewModel.uploadNow() },
                        label = { Text("Upload Now") },
                        colors = ChipDefaults.secondaryChipColors(),
                        enabled = queueCount > 0
                    )
                }
                status?.let { state ->
                    item {
                        Text(
                            "Status: ${state.message}",
                            color = if (state.isError) {
                                MaterialTheme.colors.error
                            } else {
                                MaterialTheme.colors.onSurface
                            }
                        )
                    }
                }
                item {
                    Chip(
                        onClick = { showConfig = true },
                        label = { Text("Config") },
                        colors = ChipDefaults.secondaryChipColors()
                    )
                }
            }
        }
    }
}

@Preview(device = WearDevices.SMALL_ROUND, showSystemUi = true)
@Composable
fun DefaultPreview() {
    WearApp()
}

private fun hasForegroundLocationPermission(context: Context): Boolean {
    val fine = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    val coarse = ContextCompat.checkSelfPermission(
        context,
        Manifest.permission.ACCESS_COARSE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
    return fine || coarse
}

private fun hasBackgroundLocationPermission(context: Context): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    } else {
        true
    }
}

private fun vibratePattern(vibrator: Vibrator, pattern: LongArray) {
    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(pattern, -1)
        }
    } catch (exception: SecurityException) {
        // If permission is missing, ignore haptic feedback to avoid crashes.
    }
}
