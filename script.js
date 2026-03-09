const handleLogin = () => {
    const username = document.getElementById("username-input").value
    const password = document.getElementById("password-input").value
    const errorMsg = document.getElementById("login-error")

    if (username === "admin" && password === "admin123") {
        errorMsg.classList.add("hidden")
        document.getElementById("login-page").classList.add("hidden")
        document.getElementById("main-page").classList.remove("hidden")
        setActiveTab("all")
        loadAllIssues()
    } else {
        errorMsg.classList.remove("hidden")
    }
}

document.getElementById("username-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin()
})
document.getElementById("password-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin()
})

const setActiveTab = (tab) => {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active-tab"))
    document.getElementById("tab-" + tab).classList.add("active-tab")
}

const changeTab = (tab) => {
    setActiveTab(tab)
    document.getElementById("search-input").value = ""
    if (tab === "all") loadAllIssues()
    else if (tab === "open") loadFilteredIssues("open")
    else if (tab === "closed") loadFilteredIssues("closed")
}

const showSpinner = () => {
    document.getElementById("loading-spinner").classList.remove("hidden")
    document.getElementById("issue-container").innerHTML = ""
}

const hideSpinner = () => {
    document.getElementById("loading-spinner").classList.add("hidden")
}


const loadAllIssues = () => {
    showSpinner()
    fetch("https://phi-lab-server.vercel.app/api/v1/lab/issues")
        .then(res => res.json())
        .then(json => {
            hideSpinner()
            const issues = json.data
            updateCountBar(issues, "all")
            displayIssues(issues)
        })
}

const loadFilteredIssues = (status) => {
    showSpinner()
    fetch("https://phi-lab-server.vercel.app/api/v1/lab/issues")
        .then(res => res.json())
        .then(json => {
            hideSpinner()
            const allIssues = json.data
            const filtered = allIssues.filter(issue => issue.status === status)
            updateCountBar(filtered, status)
            displayIssues(filtered)
        })
}


const handleSearch = () => {
    const q = document.getElementById("search-input").value
    if (!q) {
        loadAllIssues()
        return
    }
    showSpinner()
    fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${q}`)
        .then(res => res.json())
        .then(json => {
            hideSpinner()
            const issues = json.data
            updateCountBar(issues, "search")
            displayIssues(issues)
        })
}

document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch()
})

const updateCountBar = (issues, type) => {
    const list = issues
    const countText = document.getElementById("issue-count-text")

    if (type === "open") countText.textContent = list.length + " Open Issues"
    else if (type === "closed") countText.textContent = list.length + " Closed Issues"
    else if (type === "search") countText.textContent = list.length + " Issues Found"
    else countText.textContent = list.length + " Issues"

    const openCount = list.filter(i => i.status === "open").length
    const closedCount = list.filter(i => i.status === "closed").length
    document.getElementById("open-count").textContent = openCount
    document.getElementById("closed-count").textContent = closedCount
}

const getPriorityBadge = (priority) => {
    if (!priority) return ""
    const p = priority.toUpperCase()
    let cls = "priority-default"
    if (p === "HIGH") cls = "priority-high"
    else if (p === "MEDIUM") cls = "priority-medium"
    else if (p === "LOW") cls = "priority-low"
    return `<span class="priority-badge ${cls}">${p}</span>`
}


const getStateIcon = (status) => {
    if (status === "open") {
        return `<span class="state-icon open"><i class="fa-solid fa-circle-dot"></i></span>`
    }
    return `<span class="state-icon closed"><i class="fa-solid fa-circle-check"></i></span>`
}

const getLabelBadges = (labels) => {
    if (!labels || labels.length === 0) return ""
    return labels.map(label => {
        const n = label.toLowerCase()
        let cls = "label-default"
        if (n.includes("bug")) cls = "label-bug"
        else if (n.includes("help")) cls = "label-help"
        else if (n.includes("feature")) cls = "label-feature"
        else if (n.includes("enhancement")) cls = "label-enhancement"
        else if (n.includes("question")) cls = "label-question"
        return `<span class="label-badge ${cls}">${label.toUpperCase()}</span>`
    }).join("")
}


const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US")
}


const displayIssues = (issues) => {
    const container = document.getElementById("issue-container")
    container.innerHTML = ""

    if (!issues || issues.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:5rem 0; color:#9ca3af;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:3rem;"></i>
                <p style="font-size:1.1rem; font-weight:600; margin-top:0.75rem;">No issues found!</p>
            </div>
        `
        return
    }

    issues.forEach(issue => {
        const card = document.createElement("div")
        const cardStateClass = issue.status === "open" ? "card-open" : "card-closed"

        const desc = issue.description
            ? issue.description.substring(0, 90) + (issue.description.length > 90 ? "..." : "")
            : "No description provided."

        card.className = "issue-card " + cardStateClass
        card.onclick = () => openModal(issue.id)

        card.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between;">
                ${getStateIcon(issue.status)}
                ${getPriorityBadge(issue.priority)}
            </div>

            <p class="card-title">${issue.title || "Untitled"}</p>

            <p class="card-desc">${desc}</p>

            <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                ${getLabelBadges(issue.labels)}
            </div>

            <hr style="border:none; border-top:1px solid #f3f4f6; margin-top:auto;" />

            <div class="card-bottom">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span><span style="font-weight:700; color:#374151;">#${issue.id}</span> by <span style="font-weight:600; color:#374151;">${issue.author || "Unknown"}</span></span>
                    <span>${formatDate(issue.createdAt)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
                    <span>Assignee: <span style="font-weight:600; color:#374151;">${issue.assignee || "Unassigned"}</span></span>
                    <span>Updated: ${formatDate(issue.updatedAt)}</span>
                </div>
            </div>
        `

        container.appendChild(card)
    })
}

const openModal = (id) => {
    const modal = document.getElementById("issue-modal")
    const content = document.getElementById("modal-content")
    const spinner = document.getElementById("modal-spinner")

    modal.classList.remove("hidden")
    content.innerHTML = ""
    spinner.classList.remove("hidden")

    fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issue/${id}`)
        .then(res => res.json())
        .then(json => {
            spinner.classList.add("hidden")
            const issue = json.data

            const statePill = issue.status === "open"
                ? `<span class="state-pill-open">Opened</span>`
                : `<span class="state-pill-closed">Closed</span>`

            content.innerHTML = `
                <h2 style="font-size:1.4rem; font-weight:800; color:#111827; margin-bottom:1rem;">
                    ${issue.title || "Untitled"}
                </h2>

                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:0.5rem; margin-bottom:1rem; font-size:0.85rem; color:#6b7280;">
                    ${statePill}
                    <span>•</span>
                    <span>Opened by <strong style="color:#374151;">${issue.author || "Unknown"}</strong></span>
                    <span>•</span>
                    <span>${formatDate(issue.createdAt)}</span>
                </div>

                <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.25rem;">
                    ${getLabelBadges(issue.labels)}
                </div>

                <p style="font-size:0.875rem; color:#4b5563; line-height:1.7; margin-bottom:1.5rem;">
                    ${issue.description || "No description available."}
                </p>

                <div style="background:#f9fafb; border-radius:0.75rem; padding:1.25rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
                    <div>
                        <p style="font-size:0.8rem; color:#9ca3af; margin-bottom:0.25rem;">Assignee:</p>
                        <p style="font-weight:700; color:#111827;">${issue.assignee || "Unassigned"}</p>
                    </div>
                    <div>
                        <p style="font-size:0.8rem; color:#9ca3af; margin-bottom:0.25rem;">Priority:</p>
                        ${getPriorityBadge(issue.priority)}
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end;">
                    <button class="close-btn" onclick="closeModal()">Close</button>
                </div>
            `
        })
}


const closeModal = () => {
    document.getElementById("issue-modal").classList.add("hidden")
    document.getElementById("modal-content").innerHTML = ""
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal()
})