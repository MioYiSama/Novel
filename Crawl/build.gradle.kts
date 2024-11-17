plugins {
    kotlin("plugin.serialization") version "+"
}

dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:+")

    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:+")

    implementation("org.jsoup:jsoup:+")

    implementation("org.seleniumhq.selenium:selenium-java:+")
}