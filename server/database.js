import mysql from "mysql2"
import dotenv from "dotenv"
dotenv.config()

const pool = mysql
    .createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    })
    .promise()

export async function getAnimesCnt() {
    const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset")
    return result[0]
}

export async function getWatchStatusCnt(id) {
    if (id) {
        const result = await pool.query("SELECT count(*) as cnt FROM users_status WHERE user_id = ?", [id])
        return result[0]
    }
    const result = await pool.query("SELECT count(*) as cnt FROM users_status")
    return result[0]
}

export async function getRatingCnt(id) {
    if (id) {
        const result = await pool.query("SELECT count(*) as cnt FROM users_score WHERE user_id = ?", [id])
        return result[0]
    }
    const result = await pool.query("SELECT count(*) as cnt FROM users_score")
    return result[0]
}

export async function getUserCnt() {
    const result = await pool.query("SELECT count(*) as cnt FROM users_details")
    return result[0]
}

export async function getReviewCnt(id) {
    if (id) {
        const result = await pool.query("SELECT count(*) as cnt FROM users_review WHERE user_id = ?", [id])
        return result[0]
    }
    const result = await pool.query("SELECT count(*) as cnt FROM users_review")
    return result[0]
}

export async function getAnimes() {
    const result = await pool.query("SELECT * FROM anime_dataset limit 10")
    return result[0]
}

export async function getAnime(id) {
    const result = await pool.query("SELECT * FROM anime_dataset WHERE anime_id = ?", [id])
    return result[0]
}

export async function getAnimeDetails(id) {
    const result = await pool.query("SELECT * FROM anime_details WHERE anime_id = ?", [id])
    return result[0]
}

export async function getGenres() {
    const result = await pool.query("SELECT * FROM genres")
    return result[0]
}

export async function getGenreName(id) {
    const result = await pool.query("SELECT Genre_name FROM genres WHERE Genre_id = ?", [id])
    return result[0]
}

export async function getGenresCnt(id) {
    if (id) {
        const result = await pool.query("SELECT count(anime_genres.anime_id) as cnt FROM anime_genres WHERE anime_genres.Genre_id = ?", [
            id,
        ])
        return result[0]
    } else {
        const result = await pool.query(
            "SELECT anime_genres.Genre_id, count(anime_genres.anime_id) as cnt FROM anime_genres GROUP BY anime_genres.Genre_id"
        )
        return result[0]
    }
}

export async function findUserByEmail(email) {
    const result = await pool.query("SELECT * FROM users_account WHERE users_account.user_email = ?", [email])
    return result[0][0]
}

export async function getProfile(id) {
    const result = await pool.query("SELECT * FROM users_details WHERE users_details.Mal_id = ?", [id])
    return result[0][0]
}

export async function getEmail(id) {
    const result = await pool.query("SELECT user_email FROM users_account WHERE users_account.user_id = ?", [id])
    return result[0][0]
}

export async function getRank(id) {
    const result = await pool.query(
        "SELECT ranking FROM (SELECT anime_id,RANK() OVER (ORDER BY weight_score DESC,mean_score DESC,members DESC,anime_id)AS ranking FROM anime_statistic )A WHERE A.anime_id = ?;",
        [id]
    )
    return result[0]
}

export async function getPopularity(id) {
    const result = await pool.query(
        "SELECT popularity,members FROM (SELECT anime_id,members,RANK() OVER (ORDER BY members DESC) popularity FROM anime_statistic)A WHERE anime_id = ?",
        [id]
    )
    return result[0]
}

export async function getMeanScore(id) {
    const result = await pool.query("SELECT mean_score,scored_by FROM anime_statistic WHERE anime_statistic.anime_id = ?", [id])
    return result[0]
}

export async function getAnimeGenres(id) {
    const result = await pool.query(
        "select genre_name, anime_genres.genre_id from genres,anime_dataset,anime_genres where anime_dataset.anime_id = ? and genres.Genre_id = anime_genres.Genre_id and anime_dataset.anime_id = anime_genres.anime_id",
        [id]
    )
    return result[0]
}

export async function getScoreDistribution(id) {
    const result = await pool.query(
        "SELECT rating as score,COUNT(*) as cnt FROM (SELECT anime_id,rating FROM users_score where anime_id = ?)A GROUP BY anime_id,rating ORDER BY rating",
        [id]
    )
    return result[0]
}

export async function getWatchStatus(id) {
    const result = await pool.query(
        "SELECT status_id as watch_status_id,COUNT(*) as cnt FROM (SELECT anime_id,status_id FROM users_status where anime_id = ?)A GROUP BY anime_id,status_id ORDER BY status_id",
        [id]
    )
    return result[0]
}

export async function getReviews(id) {
    const result = await pool.query(
        "SELECT Username as username,review,rating as score from users_details,(SELECT users_review.user_id, users_review.review, users_score.rating FROM users_review LEFT OUTER JOIN users_score ON users_review.user_id = users_score.user_id AND users_review.anime_id = users_score.anime_id WHERE users_review.anime_id = ?) C WHERE users_details.Mal_ID = C.user_id LIMIT 100",
        [id]
    )
    return result[0]
}

export async function getWeightScore(id) {
    const result = await pool.query("SELECT weight_score FROM anime_statistic WHERE anime_id = ?;", [id])
    return result[0]
}

export async function getTopAnime(id, type, st, ed, display) {
    const typeValues = type.split("+")
    if (typeValues != "Default") {
        if (id) {
            if (display == "Default") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,members_cnt,type,Premiered,user_score,user_status from (SELECT B.anime_id,score,weight_score,ranking,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,ranking,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY weight_score DESC,mean_score DESC,members DESC,anime_id) AS ranking FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset WHERE type in (?))ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result LEFT OUTER JOIN anime_dataset on result.anime_id = anime_dataset.anime_id",
                    [typeValues, ed - st + 1, parseInt(st - 1), id, id]
                )
                return result[0]
            } else if (display == "Seen") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY weight_score DESC,score DESC,members_cnt DESC,anime_id) AS ranking,members_cnt,type,Premiered,user_score,user_status from (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset WHERE type in (?)))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result LEFT OUTER JOIN anime_dataset on result.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL limit ? OFFSET ?",
                    [typeValues, id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            } else if (display == "NotSeen") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY weight_score DESC,score DESC,members_cnt DESC,anime_id) AS ranking,members_cnt,type,Premiered,user_score,user_status from (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset WHERE type in (?)))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result LEFT OUTER JOIN anime_dataset on result.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL limit ? OFFSET ?",
                    [typeValues, id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            }
        } else {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,ranking,members_cnt,type,Premiered from (SELECT anime_statistic.anime_id,mean_score as score,members as members_cnt,RANK() OVER ( ORDER BY weight_score DESC,mean_score DESC,members DESC,anime_id) ranking FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset WHERE type in (?)) ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER JOIN anime_dataset on choosen_id.anime_id = anime_dataset.anime_id",
                [typeValues, ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        }
    } else {
        if (id) {
            if (display == "Default") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,members_cnt,type,Premiered,user_score,user_status from (SELECT B.anime_id,score,weight_score,ranking,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,ranking,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY weight_score DESC,mean_score DESC,members DESC,anime_id) AS ranking FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset)ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result LEFT OUTER JOIN anime_dataset on result.anime_id = anime_dataset.anime_id",
                    [ed - st + 1, parseInt(st - 1), id, id]
                )
                return result[0]
            } else if (display == "Seen") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY weight_score DESC,score DESC,members_cnt DESC,anime_id) AS ranking,members_cnt,type,Premiered,user_score,user_status from (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result LEFT OUTER JOIN anime_dataset on result.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL limit ? OFFSET ?",
                    [id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            } else if (display == "NotSeen") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY weight_score DESC,score DESC,members_cnt DESC,anime_id) AS ranking,members_cnt,type,Premiered,user_score,user_status from (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result LEFT OUTER JOIN anime_dataset on result.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL limit ? OFFSET ?",
                    [id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            }
        } else {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,ranking,members_cnt,type,Premiered from (SELECT anime_statistic.anime_id,mean_score as score,members as members_cnt,RANK() OVER ( ORDER BY weight_score DESC,mean_score DESC,members DESC,anime_id) ranking FROM anime_statistic WHERE anime_id in(SELECT anime_id FROM anime_dataset) ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER JOIN anime_dataset on choosen_id.anime_id = anime_dataset.anime_id",
                [ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        }
    }
}

export async function getAnimesByGenre(id, genre_id, type, st, ed, display) {
    if (id) {
        let result
        if (display == "Default" || !display) {
            if (type == "Score") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY weight_score DESC,members DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [genre_id, ed - st + 1, parseInt(st - 1), id, id]
                )
            } else if (type == "Members") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [genre_id, ed - st + 1, parseInt(st - 1), id, id]
                )
            } else if (type == "Newest") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Premiered DESC,weight_score DESC,members DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [genre_id, ed - st + 1, parseInt(st - 1), id, id]
                )
            } else if (type == "Title") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Name,weight_score DESC,members DESC)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [genre_id, ed - st + 1, parseInt(st - 1), id, id]
                )
            }
        } else if (display == "Seen") {
            if (type == "Score") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY weight_score DESC,members_cnt DESC,Premiered DESC,Name limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Members") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY members_cnt DESC,weight_score DESC,Premiered DESC,Name limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Newest") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY Premiered DESC,weight_score DESC,members_cnt DESC,Name limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Title") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY Name,weight_score DESC,members_cnt DESC,Premiered DESC limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            }
        } else if (display == "NotSeen") {
            if (type == "Score") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY weight_score DESC,members_cnt DESC,Premiered DESC,Name limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Members") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY members_cnt DESC,weight_score DESC,Premiered DESC,Name limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Newest") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY Premiered DESC,weight_score DESC,members_cnt DESC,Name limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Title") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?))choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY Name,weight_score DESC,members_cnt DESC,Premiered DESC limit ? OFFSET ?",
                    [genre_id, id, id, ed - st + 1, parseInt(st - 1)]
                )
            }
        }
        return result[0]
    } else {
        let result
        if (type == "Score") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY weight_score DESC,members DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [genre_id, ed - st + 1, parseInt(st - 1)]
            )
        } else if (type == "Members") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [genre_id, ed - st + 1, parseInt(st - 1)]
            )
        } else if (type == "Newest") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Premiered DESC,weight_score DESC,members DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [genre_id, ed - st + 1, parseInt(st - 1)]
            )
        } else if (type == "Title") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Name,weight_score DESC,members DESC,Premiered DESC)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE anime_statistic.anime_id in(SELECT anime_id FROM anime_genres WHERE Genre_id = ?)ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [genre_id, ed - st + 1, parseInt(st - 1)]
            )
        }
        return result[0]
    }
}

export async function getAnimesByLetter(id, letter, type, st, ed, display) {
    letter = letter + "%"
    if (id) {
        let result
        if (display == "Default" || !display) {
            if (type == "Score") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY weight_score DESC,members DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [letter, ed - st + 1, parseInt(st - 1), id, id]
                )
            } else if (type == "Members") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [letter, ed - st + 1, parseInt(st - 1), id, id]
                )
            } else if (type == "Newest") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Premiered DESC,weight_score DESC,members DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [letter, ed - st + 1, parseInt(st - 1), id, id]
                )
            } else if (type == "Title") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Name,weight_score DESC,members DESC)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [letter, ed - st + 1, parseInt(st - 1), id, id]
                )
            }
        } else if (display == "Seen") {
            if (type == "Score") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY weight_score DESC,members_cnt DESC,Premiered,Name DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Members") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY members_cnt DESC,weight_score DESC,Premiered,Name DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Newest") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY Premiered Desc,weight_score DESC,members_cnt DESC,Name DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Title") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL ORDER BY Name,weight_score DESC,members_cnt DESC,Premiered DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            }
        } else if (display == "NotSeen") {
            if (type == "Score") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY weight_score DESC,members_cnt DESC,Premiered,Name DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Members") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY members_cnt DESC,weight_score DESC,Premiered,Name DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Newest") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY Premiered Desc,weight_score DESC,members_cnt DESC,Name DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            } else if (type == "Title") {
                result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL ORDER BY Name,weight_score DESC,members_cnt DESC,Premiered DESC limit ? OFFSET ?",
                    [letter, id, id, ed - st + 1, parseInt(st - 1)]
                )
            }
        }
        return result[0]
    } else {
        let result
        if (type == "Score") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY weight_score DESC,members DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [letter, ed - st + 1, parseInt(st - 1)]
            )
        } else if (type == "Members") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Premiered DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [letter, ed - st + 1, parseInt(st - 1)]
            )
        } else if (type == "Newest") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Premiered DESC,weight_score DESC,members DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [letter, ed - st + 1, parseInt(st - 1)]
            )
        } else if (type == "Title") {
            result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY Name,weight_score DESC,members DESC,Premiered DESC)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name LIKE ? ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [letter, ed - st + 1, parseInt(st - 1)]
            )
        }
        return result[0]
    }
}

export async function getRecommend(id) {
    const result = await pool.query(
        "SELECT Genre_name, anime_genres.Genre_id FROM anime_genres JOIN genres on anime_genres.Genre_id = genres.Genre_id WHERE anime_id in (SELECT anime_id FROM users_score WHERE user_id = ? AND rating >= 8)GROUP BY anime_genres.Genre_id ORDER BY COUNT(*) DESC LIMIT 5",
        [id]
    )
    return result[0]
}

export async function getTopAnimeByGender(id, gender, st, ed, display) {
    if (id) {
        if (display == "Default" || !display) {
            if (gender == "Male") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt,RANK() OVER (ORDER BY Male DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [ed - st + 1, parseInt(st - 1), id, id]
                )
                return result[0]
            } else {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt,RANK() OVER (ORDER BY Female DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                    [ed - st + 1, parseInt(st - 1), id, id]
                )
                return result[0]
            }
        } else if (display == "Seen") {
            if (gender == "Male") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK()OVER(ORDER BY Male_cnt DESC,weight_score DESC,Name) as ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,Male_cnt,Female_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL limit ? OFFSET ?",
                    [id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            } else {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK()OVER(ORDER BY Female_cnt DESC,weight_score DESC,Name) as ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,Male_cnt,Female_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL limit ? OFFSET ?",
                    [id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            }
        } else if (display == "NotSeen") {
            if (gender == "Male") {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK()OVER(ORDER BY Male_cnt DESC,weight_score DESC,Name) as ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,Male_cnt,Female_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL limit ? OFFSET ?",
                    [id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            } else {
                const result = await pool.query(
                    "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK()OVER(ORDER BY Female_cnt DESC,weight_score DESC,Name) as ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,Male_cnt,Female_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,Male_cnt,Female_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL limit ? OFFSET ?",
                    [id, id, ed - st + 1, parseInt(st - 1)]
                )
                return result[0]
            }
        }
    } else {
        if (gender == "Male") {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt,RANK() OVER (ORDER BY Male DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        } else {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,Male_cnt,Female_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,ranking,Male_cnt,Female_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,Male as Male_cnt,Female as Female_cnt,RANK() OVER (ORDER BY Female DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        }
    }
}

export async function getTopAnimeByYear(id, year, st, ed, display) {
    var yearArray = year.split("-")
    var startYear = parseInt(yearArray[0])
    var endYear = parseInt(yearArray[1])
    if (startYear > endYear) {
        var temp = endYear
        endYear = startYear
        startYear = temp
    }
    if (id) {
        if (display == "Default" || !display) {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,ranking,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,ranking,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,ranking,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Premiered >= ? AND Premiered <= ? ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [startYear, endYear, ed - st + 1, parseInt(st - 1), id, id]
            )
            return result[0]
        } else if (display == "Seen") {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY members_cnt DESC,weight_score DESC,Name)AS ranking,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Premiered >= ? AND Premiered <= ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL limit ? OFFSET ?",
                [startYear, endYear, id, id, ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        } else if (display == "NotSeen") {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY members_cnt DESC,weight_score DESC,Name)AS ranking,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Premiered >= ? AND Premiered <= ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL limit ? OFFSET ?",
                [startYear, endYear, id, id, ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        }
    } else {
        const result = await pool.query(
            "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,ranking,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Premiered >= ? AND Premiered <= ? ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
            [startYear, endYear, ed - st + 1, parseInt(st - 1)]
        )
        return result[0]
    }
}

export async function searchAnime(id, keyword, st, ed, display) {
    keyword = "%" + keyword + "%"
    if (id) {
        if (display == "Default" || !display) {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,ranking,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,ranking,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,ranking,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name like ? ORDER BY ranking limit ? OFFSET ?)choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
                [keyword, ed - st + 1, parseInt(st - 1), id, id]
            )
            return result[0]
        } else if (display == "Seen") {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY members_cnt DESC,weight_score DESC,Name)AS ranking,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name like ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NOT NULL OR user_score is NOT NULL limit ? OFFSET ?",
                [keyword, id, id, ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        } else if (display == "NotSeen") {
            const result = await pool.query(
                "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,RANK() OVER (ORDER BY members_cnt DESC,weight_score DESC,Name)AS ranking,members_cnt,type,Premiered,Synopsis,user_score,user_status FROM (SELECT anime_details.anime_id,score,weight_score,members_cnt,Synopsis,user_score,user_status FROM (SELECT B.anime_id,score,weight_score,members_cnt,user_score,user_status FROM (SELECT choosen_id.anime_id,score,weight_score,members_cnt,user_score FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name like ? )choosen_id LEFT OUTER join (SELECT anime_id,rating as user_score from users_score WHERE user_id = ?)A on A.anime_id = choosen_id.anime_id) B LEFT OUTER JOIN (SELECT anime_id,status_name as user_status from users_status,status WHERE user_id = ? and users_status.status_id = status.status_id)A on B.anime_id = A.anime_id) result JOIN anime_details on result.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id where user_status is NULL AND user_score is NULL limit ? OFFSET ?",
                [keyword, id, id, ed - st + 1, parseInt(st - 1)]
            )
            return result[0]
        }
    } else {
        const result = await pool.query(
            "SELECT anime_dataset.anime_id,Name,Image_URL,score,weight_score,ranking,members_cnt,type,Premiered,Synopsis FROM (SELECT anime_details.anime_id,score,weight_score,ranking,members_cnt,Synopsis FROM (SELECT anime_statistic.anime_id,mean_score as score,weight_score,members as members_cnt,RANK() OVER (ORDER BY members DESC,weight_score DESC,Name)AS ranking FROM anime_statistic join anime_dataset on anime_statistic.anime_id = anime_dataset.anime_id WHERE Name like ? ORDER BY ranking limit ? OFFSET ?)choosen_id JOIN anime_details on choosen_id.anime_id = anime_details.anime_id) final LEFT OUTER JOIN anime_dataset on final.anime_id = anime_dataset.anime_id",
            [keyword, ed - st + 1, parseInt(st - 1)]
        )
        return result[0]
    }
}

export async function getAnimesCntWithCondition(id, type, param, display) {
    if (id) {
        if (display == "Default" || !display) {
            if (type == "year") {
                var yearArray = param.split("-")
                var startYear = parseInt(yearArray[0])
                var endYear = parseInt(yearArray[1])
                if (startYear > endYear) {
                    var temp = endYear
                    endYear = startYear
                    startYear = temp
                }
                const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE Premiered >= ? AND Premiered <= ?", [
                    startYear,
                    endYear,
                ])
                return result[0]
            } else if (type == "top") {
                param = param.split("+")
                if (param == "Default") {
                    const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset")
                    return result[0]
                } else {
                    const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE type in (?)", [param])
                    return result[0]
                }
            } else if (type == "letter") {
                param = param + "%"
                const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE Name like ?", [param])
                return result[0]
            } else if (type == "search") {
                param = "%" + param + "%"
                const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE Name like ?", [param])
                return result[0]
            }
        } else if (display == "Seen") {
            if (type == "year") {
                var yearArray = param.split("-")
                var startYear = parseInt(yearArray[0])
                var endYear = parseInt(yearArray[1])
                if (startYear > endYear) {
                    var temp = endYear
                    endYear = startYear
                    startYear = temp
                }
                const result = await pool.query(
                    "SELECT count(*) as cnt FROM anime_dataset WHERE Premiered >= ? AND Premiered <= ? AND anime_id IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                    [startYear, endYear]
                )
                return result[0]
            } else if (type == "top") {
                param = param.split("+")
                if (param == "Default") {
                    const result = await pool.query(
                        "SELECT count(*) as cnt FROM anime_dataset where anime_id IN (SELECT anime_id FROM users_status WHERE user_id = ?)"
                    )
                    return result[0]
                } else {
                    const result = await pool.query(
                        "SELECT count(*) as cnt FROM anime_dataset WHERE type in (?) AND anime_id IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                        [param]
                    )
                    return result[0]
                }
            } else if (type == "letter") {
                param = param + "%"
                const result = await pool.query(
                    "SELECT count(*) as cnt FROM anime_dataset WHERE Name like ? AND anime_id IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                    [param]
                )
                return result[0]
            } else if (type == "search") {
                param = "%" + param + "%"
                const result = await pool.query(
                    "SELECT count(*) as cnt FROM anime_dataset WHERE Name like ? AND anime_id IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                    [param]
                )
                return result[0]
            }
        } else if (display == "NotSeen") {
            if (type == "year") {
                var yearArray = param.split("-")
                var startYear = parseInt(yearArray[0])
                var endYear = parseInt(yearArray[1])
                if (startYear > endYear) {
                    var temp = endYear
                    endYear = startYear
                    startYear = temp
                }
                const result = await pool.query(
                    "SELECT count(*) as cnt FROM anime_dataset WHERE Premiered >= ? AND Premiered <= ? AND anime_id NOT IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                    [startYear, endYear]
                )
                return result[0]
            } else if (type == "top") {
                param = param.split("+")
                if (param == "Default") {
                    const result = await pool.query(
                        "SELECT count(*) as cnt FROM anime_dataset where anime_id NOT IN (SELECT anime_id FROM users_status WHERE user_id = ?)"
                    )
                    return result[0]
                } else {
                    const result = await pool.query(
                        "SELECT count(*) as cnt FROM anime_dataset WHERE type in (?) AND anime_id NOT IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                        [param]
                    )
                    return result[0]
                }
            } else if (type == "letter") {
                param = param + "%"
                const result = await pool.query(
                    "SELECT count(*) as cnt FROM anime_dataset WHERE Name like ? AND anime_id NOT IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                    [param]
                )
                return result[0]
            } else if (type == "search") {
                param = "%" + param + "%"
                const result = await pool.query(
                    "SELECT count(*) as cnt FROM anime_dataset WHERE Name like ? AND anime_id NOT IN (SELECT anime_id FROM users_status WHERE user_id = ?)",
                    [param]
                )
                return result[0]
            }
        }
    } else {
        if (type == "year") {
            var yearArray = param.split("-")
            var startYear = parseInt(yearArray[0])
            var endYear = parseInt(yearArray[1])
            if (startYear > endYear) {
                var temp = endYear
                endYear = startYear
                startYear = temp
            }
            const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE Premiered >= ? AND Premiered <= ?", [
                startYear,
                endYear,
            ])
            return result[0]
        } else if (type == "top") {
            param = param.split("+")
            if (param == "Default") {
                const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset")
                return result[0]
            } else {
                const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE type in (?)", [param])
                return result[0]
            }
        } else if (type == "letter") {
            param = param + "%"
            const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE Name like ?", [param])
            return result[0]
        } else if (type == "search") {
            param = "%" + param + "%"
            const result = await pool.query("SELECT count(*) as cnt FROM anime_dataset WHERE Name like ?", [param])
            return result[0]
        }
    }
}

export async function checkEmail(email) {
    const result = await pool.query("select COUNT(user_email) as cnt from users_account WHERE user_email = ?", [email])

    return result[0][0].cnt
}

export async function checkUserName(name) {
    const result = await pool.query("select COUNT(Username) as cnt from users_details WHERE Username = ?", [name])
    return result[0][0].cnt
}

export async function createID() {
    const result = await pool.query("select MAX(user_id) as mid from users_account")
    return result[0][0].mid + 1
}

export async function insertNewUser(id, name, password, email) {
    await pool.query("INSERT INTO users_account VALUES (?, ?, ?)", [id, password, email])
    await pool.query("INSERT INTO users_details VALUES (?, ?, ?, ?)", [id, name, null, null])
}

export async function getRating(user_id) {
    const result = await pool.query(
        "select users_score.anime_id, name, Image_URL ,rating from users_score, anime_dataset where user_id = ? and users_score.anime_id = anime_dataset.anime_id",
        [user_id]
    )
    //console.log(result[0])
    return result[0]
}

export async function addRating(user_id, anime_id, score) {
    await pool.query("INSERT INTO users_score VALUES (?, ?, ?)", [user_id, anime_id, score])
}

export async function updateRating(user_id, anime_id, score) {
    await pool.query("UPDATE users_score SET rating = ? where user_id = ? and anime_id = ? ", [score, user_id, anime_id])
}

export async function addStatus(user_id, anime_id, status) {
    await pool.query("INSERT INTO users_status VALUES (?, ?, ?)", [user_id, status, anime_id])
}

export async function updateStatus(user_id, anime_id, status) {
    await pool.query("UPDATE users_status SET status_id = ? where user_id = ? and anime_id = ? ", [status, user_id, anime_id])
}

export async function checkreview(user_id, anime_id) {
    const result = await pool.query("select COUNT(review) as cnt from users_review WHERE user_id = ? and anime_id = ?", [user_id, anime_id])

    return result[0][0].cnt
}

export async function checkrating(user_id, anime_id) {
    const result = await pool.query("select COUNT(rating) as cnt from users_score WHERE user_id = ? and anime_id = ?", [user_id, anime_id])

    return result[0][0].cnt
}

export async function checkwatchStatus(user_id, anime_id) {
    const result = await pool.query("select COUNT(status_id) as cnt from users_status WHERE user_id = ? and anime_id = ?", [
        user_id,
        anime_id,
    ])

    return result[0][0].cnt
}

export async function removeReview(user_id, anime_id) {
    await pool.query("DELETE FROM users_review WHERE user_id = ? AND anime_id = ?", [user_id, anime_id])
}

export async function removeRating(user_id, anime_id) {
    await pool.query("DELETE FROM users_score WHERE user_id = ? AND anime_id = ?", [user_id, anime_id])
}

export async function removeWatchStatus(user_id, anime_id) {
    await pool.query("DELETE FROM users_status WHERE user_id = ? AND anime_id = ?", [user_id, anime_id])
}

export async function getRatingWithId(user_id, anime_id) {
    const result = await pool.query("select rating from users_score where user_id = ? and users_score.anime_id = ?", [user_id, anime_id])
    return result[0]
}

export async function getWatchList(user_id) {
    const result = await pool.query(
        "select users_status.anime_id, name, Image_URL , status_name as status from users_status, anime_dataset, status where user_id = ? and users_status.anime_id = anime_dataset.anime_id and status.status_id = users_status.status_id",
        [user_id]
    )
    return result[0]
}

export async function getWatchListWithId(user_id, anime_id) {
    const result = await pool.query(
        "select status_name as status from users_status, status where user_id = ? and users_status.anime_id = ? and status.status_id = users_status.status_id",
        [user_id, anime_id]
    )
    return result[0]
}

export async function getReview(user_id) {
    const result = await pool.query(
        "select users_review.anime_id, name, Image_URL ,review from users_review, anime_dataset where user_id = ? and users_review.anime_id = anime_dataset.anime_id",
        [user_id]
    )
    return result[0]
}

export async function getReviewWithId(user_id, anime_id) {
    const result = await pool.query("select review from users_review where user_id = ? and users_review.anime_id = ?", [user_id, anime_id])
    return result[0]
}

export async function checkIfUserreviewExist(user_id, anime_id) {
    const result = await pool.query("select COUNT(*) as cnt from users_review where user_id = ? and anime_id = ?", [user_id, anime_id])
    return result[0][0].cnt
}

export async function addReview(user_id, anime_id, review) {
    await pool.query("INSERT INTO users_review VALUES(?,?,?)", [anime_id, user_id, review])
}

export async function updateReview(user_id, anime_id, review) {
    await pool.query("update users_review set review = ? where user_id = ? and anime_id = ?", [review, user_id, anime_id])
}

export async function updateProfile(user_id, gender, birthday) {
    await pool.query("update users_details set Gender = ?, Birthday = STR_TO_DATE(?, '%Y-%m-%d %H:%i:%s') where Mal_ID = ?", [
        gender,
        birthday,
        user_id,
    ])
}

export async function getWatchListDistribution(id) {
    const result = await pool.query(
        "SELECT status_id as watch_status_id,COUNT(*) as cnt FROM (SELECT user_id,status_id FROM users_status where user_id = ?)A GROUP BY user_id,status_id ORDER BY status_id",
        [id]
    )
    return result[0]
}

export async function getRatingDistribution(id) {
    const result = await pool.query(
        "SELECT rating as score,COUNT(*) as cnt FROM (SELECT user_id,rating FROM users_score where user_id = ?)A GROUP BY user_id,rating ORDER BY rating",
        [id]
    )
    return result[0]
}

export async function updatePassword(id, new_password) {
    await pool.query("UPDATE users_account SET user_password = ? WHERE user_id = ? ", [new_password, id])
}

export async function getPassword(id) {
    const result = await pool.query("SELECT user_password FROM users_account WHERE user_id = ?", [id])
    return result[0][0].user_password
}

export async function CheckIsMember(user_id) {
    const result = await pool.query(
        "select COUNT(*) as cnt from users_review, users_score, users_status where users_review.user_id = users_score.user_id and users_review.user_id = users_status.user_id and users_score.user_id = users_status.user_id and users_review.user_id = ?",
        [user_id]
    )
    console.log(result[0][0].cnt)
    return result[0][0].cnt
}

export async function AddMember(anime_id) {
    await pool.query("update anime_statistic set members = members+1 where anime_id = ?", [anime_id])
}
export async function ReduceMember(anime_id) {
    await pool.query("update anime_statistic set members = members-1 where anime_id = ?", [anime_id])
}

export async function AddScored_by(anime_id) {
    await pool.query("update anime_statistic set scored_by = scored_by+1 where anime_id = ?", [anime_id])
}

export async function DecreaseScored_by(anime_id) {
    await pool.query("update anime_statistic set scored_by = scored_by-1 where anime_id = ?", [anime_id])
}

export async function UpdateGender(user_id, anime_id) {
    const gender = await pool.query("select Gender from users_details where Mal_ID = ?", [user_id])

    if (gender == "Male") {
        await pool.query("UPDATE anime_statistic set Male = Male + 1 where anime_id = ?", [anime_id])
    } else if (gender == "Female") {
        await pool.query("UPDATE anime_statistic set Female = Female + 1 where anime_id = ?", [anime_id])
    }
}

export async function UpdateGenderMinus(user_id, anime_id) {
    const gender = await pool.query("select Gender from users_details where Mal_ID = ?", [user_id])

    if (gender == "Male") {
        await pool.query("UPDATE anime_statistic set Male = Male - 1 where anime_id = ?", [anime_id])
    } else if (gender == "Female") {
        await pool.query("UPDATE anime_statistic set Female = Female - 1 where anime_id = ?", [anime_id])
    }
}

export async function UpdateGenderWithOldGender(old_gender, anime_id) {
    //const gender = await pool.query("select Gender from users_details where Mal_ID = ?", [user_id])

    if (old_gender == "Male") {
        await pool.query(
            `UPDATE anime_statistic
            set Male = Male - 1
            ,Female = Female + 1
            where anime_id = ?`,
            [anime_id]
        )
    } else if (old_gender == "Female") {
        await pool.query(
            `UPDATE anime_statistic
            set Male = Male + 1
            ,Female = Female - 1
            where anime_id = ?`,
            [anime_id]
        )
    }
}

export async function UpdateMeanScore(score, anime_id) {
    await pool.query(
        `update anime_statistic
        set mean_score = ROUND((mean_score*scored_by + ?)/(scored_by+1), 2)  
        WHERE anime_id = ?`,
        [score, anime_id]
    )
}

export async function UpdateMeanScoreWithOldScore(old_score, new_score, anime_id) {
    await pool.query(
        `update anime_statistic
        set mean_score = ROUND((mean_score*scored_by - ? + ?)/(scored_by), 2)  
        WHERE anime_id = ?`,
        [old_score, new_score, anime_id]
    )
}

export async function UpdateMeanScoreDropScore(drop_score, anime_id) {
    await pool.query(
        `update anime_statistic
        set mean_score = (mean_score*scored_by - ?)/(scored_by-1) 
        WHERE anime_id = ?`,
        [drop_score, anime_id]
    )
}

export async function UpdateWeightScore(anime_id) {
    if (getScored_by(anime_id) >= 1000) {
        await pool.query(
            `update anime_statistic
            set weight_score = (1000 * 7.5831 /( 1000 + scored_by ) +  scored_by*mean_score / (1000+ scored_by))
            where anime_id = ?`,
            [anime_id]
        )
    }
}

export async function getScored_by(anime_id) {
    const result = await pool.query(
        `SELECT scored_by
        from anime_statistic
        where anime_id = ?`,
        [anime_id]
    )

    return result[0][0].scored_by
}

export async function getGender(user_id) {
    const result = await pool.query(
        `select Gender
        from users_details
        where Mal_ID = ?`,
        [user_id]
    )
    return result[0][0].Gender
}

export async function RemoveUser(user_id) {
    /*
    delete user account 中的 account 
    delete user details 中的 
    delete user review
    delete user score
    delete user status
    */

    await pool.query(
        `DELETE 
    from users_status
    where user_id = ?`,
        [user_id]
    )

    await pool.query(
        `DELETE
    from users_score
    WHERE user_id = ?`,
        [user_id]
    )

    await pool.query(
        `DELETE
    from users_review
    WHERE user_id = ?`,
        [user_id]
    )

    await pool.query(
        `DELETE
        from users_details
        WHERE Mal_ID = ?`,
        [user_id]
    )

    await pool.query(
        `DELETE
        from users_account
        WHERE user_id = ?`,
        [user_id]
    )
}
