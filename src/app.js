import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app=express();

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// import route
import hostregister from "./routes/host.route.js";




// route decleration
app.use("/api/v1/host",hostregister);

export {app};