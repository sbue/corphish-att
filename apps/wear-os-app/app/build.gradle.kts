plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

fun asBuildConfigString(value: String): String {
    val escaped = value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
    return "\"$escaped\""
}

val locationMetricsApiUrl = System.getenv("LOCATION_METRICS_API_URL")
    ?: "https://buenahora.com/api/metrics/location"
val locationMetricsWebhookKey = System.getenv("LOCATION_METRICS_WEBHOOK_KEY") ?: ""

android {
    namespace = "com.sbue.superplanner"
    compileSdk {
        version = release(36)
    }

    defaultConfig {
        applicationId = "com.sbue.superplanner"
        minSdk = 30
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        buildConfigField("String", "LOCATION_METRICS_API_URL", asBuildConfigString(locationMetricsApiUrl))
        buildConfigField("String", "LOCATION_METRICS_WEBHOOK_KEY", asBuildConfigString(locationMetricsWebhookKey))
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    useLibrary("wear-sdk")
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.work.runtime.ktx)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.play.services.wearable)
    implementation(libs.play.services.location)
    implementation(libs.okhttp)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(platform(libs.compose.bom))
    implementation(libs.ui)
    implementation(libs.ui.graphics)
    implementation(libs.ui.tooling.preview)
    implementation(libs.compose.material)
    implementation(libs.compose.foundation)
    implementation(libs.wear.tooling.preview)
    implementation(libs.activity.compose)
    implementation(libs.core.splashscreen)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.ui.test.junit4)
    debugImplementation(libs.ui.tooling)
    debugImplementation(libs.ui.test.manifest)
}
