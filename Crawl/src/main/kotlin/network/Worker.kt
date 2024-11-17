package top.mioyi.network

import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.openqa.selenium.edge.*
import org.openqa.selenium.support.ui.WebDriverWait
import java.time.Duration
import kotlin.random.Random

class Worker : AutoCloseable {
    private val routes = Channel<String>(Channel.BUFFERED)
    private val documents = Channel<Document>(Channel.BUFFERED)

    @OptIn(DelicateCoroutinesApi::class)
    private val worker = GlobalScope.launch {
        for (route in routes) {
            documents.send(fetch(HOST + route))
            sleep()
        }
    }

    fun getDocument(route: String): Document = runBlocking {
        routes.send(route)
        documents.receive()
    }

    override fun close() = runBlocking {
        routes.close()
        documents.close()
        worker.cancelAndJoin()
    }
}

private val HEADERS = mapOf(
    "User-Agent" to USER_AGENT,
    "Accept-Language" to "en-US"
)

private val COOKIES by lazy {
    val options = EdgeOptions().apply {
        addArguments(
            "--user-agent=$USER_AGENT",
            "--headless",
            "--window-size=0x0",
            "--log-level=3",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-infobars",
            "--disable-popup-blocking",
            "--disable-web-security",
            "--disable-prompt-on-repost",
            "--disable-blink-features=AutomationControlled",
            "--disable-gpu", // 禁用GPU
            "--disable-extensions", // 禁用扩展
            "--mute-audio", // 禁用音频
            "--blink-settings=imagesEnabled=false", // 禁用图片
        )
    }

    val driver = EdgeDriver(options)

    try {
        driver.get(HOST)

        WebDriverWait(driver, Duration.ofSeconds(5)).until {
            it.manage().getCookieNamed("cf_clearance") != null
        }

        driver.manage().cookies.associate { it.name to it.value }
    } finally {
        driver.quit()
    }
}

private fun fetch(url: String): Document {
    println("Fetching: $url")

    return Jsoup.connect(url)
        .headers(HEADERS)
        .cookies(COOKIES)
        .get()
}

private suspend fun sleep() {
    val delayDuration = Random.nextLong(1500L, 3500L)
    println("Delay for $delayDuration ms")
    delay(delayDuration)
}