import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { setPageTitle } from "../../features/common/headerSlice"
import { Link, useParams } from "react-router-dom"
import Squares2X2Icon from "@heroicons/react/24/outline/Squares2X2Icon"
import ListBulletIcon from "@heroicons/react/24/outline/ListBulletIcon"
import axiosInstance from "../../app/axios"
import { openModal } from "../../features/common/modalSlice"
import { MODAL_BODY_TYPES } from "../../utils/globalConstantUtil"

const WatchListButtons = ({ id, name, img, state }) => {
    const dispatch = useDispatch()
    const token = localStorage.getItem("token")
    const openAddWatchListModal = () => {
        if (!token) {
            dispatch(openModal({ title: "You need to login", bodyType: MODAL_BODY_TYPES.REQUIRE_LOGIN }))
        } else {
            dispatch(
                openModal({
                    title: "Update Watch Status",
                    bodyType: MODAL_BODY_TYPES.WATCHLIST_ADD_NEW,
                    extraObject: { id: id, name: name, img: img, state: state },
                })
            )
        }
    }

    return (
        <div className="inline-block ">
            <button className="btn btn-sm normal-case btn-primary" onClick={() => openAddWatchListModal()}>
                Add to WatchList
            </button>
        </div>
    )
}

const RatingButtons = ({ id, name, img, state }) => {
    const dispatch = useDispatch()
    const token = localStorage.getItem("token")
    const openAddRatingModal = () => {
        if (!token) {
            dispatch(openModal({ title: "You need to login", bodyType: MODAL_BODY_TYPES.REQUIRE_LOGIN }))
        } else {
            dispatch(
                openModal({
                    title: "Update Rating",
                    bodyType: MODAL_BODY_TYPES.RATING_ADD_NEW,
                    extraObject: { id: id, name: name, img: img, state: state },
                })
            )
        }
    }
    return (
        <div className="inline-block ">
            <button className="btn btn-sm normal-case" onClick={() => openAddRatingModal()}>
                Add Rating
            </button>
        </div>
    )
}

const DetailCard = ({ detail }) => {
    const dispatch = useDispatch()

    if (!detail) {
        return <div>Loading...</div>
    }
    return (
        <div className="rounded-lg bg-base-100 shadow-md flex flex-col h-96">
            <div className="p-6 flex-grow">
                <Link to={"../details/" + detail["anime_id"]} className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">{detail["Name"]}</h2>
                </Link>
                <hr className="my-4" />
                <div className="flex items-stretch">
                    <div className="w-2/5 max-w-2/5">
                        <Link to={"../details/" + detail["anime_id"]} className="flex items-center justify-between h-48">
                            <img src={detail["Image_URL"]} alt="圖片描述" className="w-full h-full object-cover rounded-lg" />
                        </Link>
                    </div>
                    <div className="w-3/5 px-4 overflow-y-auto max-h-48 ">
                        <p className="h-full break-words">{detail["Synopsis"]}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end mb-4 mr-4">
                <RatingButtons id={detail["Anime_id"]} name={detail["Name"]} img={detail["Image_URL"]} state={detail["Watch_Status"]} />
                <WatchListButtons id={detail["Anime_id"]} name={detail["Name"]} img={detail["Image_URL"]} state={detail["Watch_Status"]} />
            </div>
        </div>
    )
}

function InternalPage() {
    const dispatch = useDispatch()
    const [values, setValues] = useState()
    const { text } = useParams()
    const [resultCnt, setResultCnt] = useState(0)
    const [compact, setCompact] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [loading, setLoading] = useState(true)
    const itemsPerPage = 48
    useEffect(() => {
        dispatch(setPageTitle({ title: "Text Search" }))
        getCount()
    }, [])

    useEffect(() => {
        setLoading(true)
        fetchData()
    }, [currentPage])

    const fetchData = () => {
        const startItem = (currentPage - 1) * itemsPerPage + 1
        const endItem = currentPage * itemsPerPage
        axiosInstance
            .get(`/api/searchAnime/${text}/${startItem}/${endItem}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `${localStorage.getItem("token")}`,
                },
            })
            .then((res) => res.data)
            .then((data) => setValues(data))
            .then(setLoading(false))
            .catch((err) => {
                console.error(err)
                console.log(localStorage.getItem("token"))
                if (err.response.data === "Token expired") {
                    localStorage.removeItem("token")
                    window.location.reload()
                }
            })
    }

    const getCount = () => {
        axiosInstance
            .get("/api/getAnimesCnt/search/" + text)
            .then((res) => res.data)
            .then((data) => {
                setResultCnt(data[0]["cnt"])
                setTotalPages(Math.ceil(data / itemsPerPage))
            })
            .catch((err) => {
                console.error(err)
                console.log(localStorage.getItem("token"))
                if (err.response.data === "Token expired") {
                    localStorage.removeItem("token")
                    window.location.reload()
                }
            })
    }

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    if (loading)
        return (
            <div className="flex justify-center items-center h-full">
                <div className="border-gray-300 h-20 w-20 animate-spin rounded-full border-8 border-t-blue-600" />
            </div>
        )

    return (
        <>
            <div className="m-5 text-xl">
                Search Result for{" "}
                <span className="font-bold">
                    {text} {resultCnt} in total
                </span>
            </div>

            <div className="divider" />
            {!compact ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {values &&
                        values.map((value, index) => {
                            return <DetailCard key={index} detail={value} />
                        })}
                </div>
            ) : (
                <table className="table w-full table-compact shadow-2xl">
                    <thead className="rounded">
                        <tr>
                            <th>Title</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {values &&
                            values.map((l, k) => {
                                return (
                                    <tr key={k}>
                                        <td>
                                            <div className="flex h-20">
                                                <img className="h-full" src={l.Image_URL} alt={l.Name} />
                                                <div className="mx-5 my-2 font-bold">{l.Name}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="font-bold">⭐{l.Score}</div>
                                        </td>
                                    </tr>
                                )
                            })}
                    </tbody>
                </table>
            )}
            <div className="flex justify-center mt-4">
                <div className="btn-group">
                    <button className="btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                        «
                    </button>

                    <button className="btn">Page {currentPage}</button>

                    <button className="btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                        »
                    </button>
                </div>
            </div>
        </>
    )
}

export default InternalPage
