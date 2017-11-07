import React        from "react"
import ReactDOM     from "react-dom"
import App          from "../components/App"
import { document } from "../utils/browser-dependencies"
import "../styles/rechord.sass"

document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(
    <App />,
    document.getElementById("rechord").appendChild(document.createElement("div"))
  )
})
