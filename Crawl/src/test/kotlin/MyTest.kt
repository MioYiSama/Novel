import org.openqa.selenium.edge.*
import org.openqa.selenium.support.ui.WebDriverWait
import top.mioyi.network.*
import java.time.Duration
import kotlin.test.Test

class MyTest {
    @Test
    fun testRegex() {
        val source = """
            <a href="/novel/4393/254501.html" class="chapter-li-a "><span class="chapter-index ">序章</span></a>
        """.trimIndent()

        val regex = Regex("""/novel/4393/(\d+).html""")

        println(regex.find(source)!!.groupValues[1].toInt())
    }


    @Test
    fun testFetch() {
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

            driver.get("https://www.bilinovel.com/novel/8/114783_1.html")
            println(driver.pageSource)

        } finally {
            driver.quit()
        }
    }
}