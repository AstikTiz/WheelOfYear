plugins {
    id("com.android.application")
}

android {
    namespace = "ai.ilands.koleso"
    compileSdk = 34

    defaultConfig {
        applicationId = "ai.ilands.koleso"
        minSdk = 23
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
