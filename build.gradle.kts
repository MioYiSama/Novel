plugins {
    idea
    kotlin("jvm") version "+"
}

idea.module {
    isDownloadSources = true
    isDownloadJavadoc = true
}

allprojects {
    group = "top.mioyi"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "kotlin")

    kotlin {
        jvmToolchain(21)
    }

    dependencies {
        testImplementation(kotlin("test"))
    }

    tasks.test {
        useJUnitPlatform()
    }
}