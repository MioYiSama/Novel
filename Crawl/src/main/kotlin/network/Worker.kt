package top.mioyi.network

import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.openqa.selenium.edge.*
import org.openqa.selenium.support.ui.WebDriverWait
import kotlin.random.Random
import kotlin.time.Duration.Companion.seconds
import kotlin.time.toJavaDuration

class Worker : AutoCloseable {
    private val driver = EdgeDriver(options)

    private val routes = Channel<String>(Channel.BUFFERED)
    private val documents = Channel<Document>(Channel.BUFFERED)

    @OptIn(DelicateCoroutinesApi::class)
    private val worker = GlobalScope.launch {
        for (route in routes) {
            documents.send(fetch(HOST + route))
            sleep()
        }
    }

    init {
        driver.get(HOST)

        WebDriverWait(driver, (5).seconds.toJavaDuration()).until {
            it.manage().getCookieNamed("cf_clearance") != null
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
        driver.close()
    }

    private fun fetch(url: String): Document {
        println("Fetching: $url")

        driver.get(url)

        return Jsoup.parse(driver.pageSource!!)
    }
}

private suspend fun sleep() {
    val delayDuration = Random.nextLong(MIN_DELAY, MAX_DELAY)
    println("Delay for $delayDuration ms")
    delay(delayDuration)
}

private val options = EdgeOptions().apply {
    addArguments(
        "--user-agent=$USER_AGENT",
        "--lang=en-US",
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