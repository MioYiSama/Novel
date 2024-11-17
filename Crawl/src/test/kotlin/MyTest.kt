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
}