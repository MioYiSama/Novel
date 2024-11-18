package top.mioyi

import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.encodeToString
import top.mioyi.data.json
import top.mioyi.network.*
import kotlin.io.path.*

fun main() = runBlocking {
//    val novel = resolveChapterID(Novel.loadFromFile(8)).also { it.saveToFile() }
//    val novel = Novel.loadFromFile(8)


    worker {
        val novel = resolveChapterID(crawlNovel(1855)).also { it.saveToFile() }
        val novelPath = Path("novels/${novel.name}").also { it.createDirectories() }

        for (volume in novel.volumes) {
            val volumePath = novelPath.resolve(volume.name).also { it.createDirectories() }

            for (chapter in volume.chapters) {
                val chapterPath = volumePath.resolve("${chapter.name}.json")

                if (chapterPath.exists()) {
                    println("Skip: $chapterPath")
                    continue
                } else {
                    println("Crawl: ${chapter.name}")
                }

                val content = crawlChapterContent(novel.id, chapter.id)
                    .toList()

                chapterPath.writeText(json.encodeToString(content))
            }
        }
    }
}