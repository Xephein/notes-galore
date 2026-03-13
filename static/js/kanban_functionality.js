async function request(address, method, data) {
    message = new Request(address, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    
    response = await fetch(message)
    body = await response.json()
    console.log(body)

    return body
}

async function createColumn() {
    position = document.querySelectorAll(".kanban-column").length

    // SEND API REQUEST
    body = {
        status: "ok",
        position: position
    }
    response = await request(window.location.pathname + "columns/", "POST", body)
    if (response["status"] != "ok") {
        console.log("Error processing request")
        console.log(response)
        return
    }

    column = document.createElement("div")
    
    // get from database
    column.id = "col-" + response["column_id"]
    column.name = column.id
    column.classList.add("kanban-column")
    column.setAttribute("data-position", position)

    header = document.createElement("div")
    header.id = column.id + "-header"
    header.classList.add("kanban-column-header")

    column_name = document.createElement("div")
    column_name.contentEditable = "plaintext-only"
    column_name.id = column.id + "-name"
    column_name.classList.add("kanban-column-name", "editable")
    column_name.setAttribute("data-placeholder", "Name...")
    column_name.addEventListener("blur", async function(e) {
        id = e.target.id.match("[0-9]+")[0]
        body = {
            status: "ok",
            title: e.target.innerHTML
        }
        response = await request(window.location.pathname + "columns/" + id, "PATCH", body)
    });

    delete_button = createDeleteButton("column")
    delete_button.setAttribute("data-parent", column.id)
    
    header.append(column_name, delete_button)

    add_button = createCardButton()
    add_button.setAttribute("data-parent", column.id)

    card_container = document.createElement("div")
    card_container.id = column.id + "-container-cards"
    card_container.classList.add("kanban-container-cards")

    column.append(header, card_container, add_button)
    return column
}

async function createCard(column_id) {
    column = document.getElementById(column_id)
    position = column.querySelectorAll(".kanban-card").length
    // SEND API REQUEST
    body = {
        status: "ok",
        position: position
    }
    col = column_id.match("[0-9]+")[0]
    response = await request(window.location.pathname + "column/"+ col + "/cards/", "POST", body)
    if (response["status"] != "ok") {
        console.log("Error processing request")
        console.log(response)
        return
    }

    card = document.createElement("div")
    card.id = "card-" + response["card_id"]
    card.classList.add("kanban-card", "draggable")
    card.draggable = "true"
    card.setAttribute("data-position", position)

    card.addEventListener("dragstart", (event) => {
        // store a ref. on the dragged elem
        dragged = event.target;
        // make it half transparent
        event.target.classList.add("dragging");

        generateSlots()

        drops = document.querySelectorAll(".dropzone")
        drops.forEach(drop => {
            drop.classList.add("potential-drop")
        })
    });

    card.addEventListener("dragend", (event) => {
        event.target.classList.remove("dragging")
        
        drops = document.querySelectorAll(".dropzone")
        drops.forEach(drop => {
            drop.classList.remove("potential-drop")
        })
    });

    header = document.createElement("div")
    header.id = card.id + "-header"
    header.classList.add("kanban-card-header")

    grab = document.createElement("div")
    grab.classList.add("kanban-card-grab")
    grab.textContent = "°°°"

    button = createDeleteButton("card")
    button.setAttribute("data-parent", card.id)

    header.append(grab, button)

    card_title = document.createElement("div")
    card_title.contentEditable = "plaintext-only"
    card_title.id = card.id + "-title"
    card_title.classList.add("kanban-card-title", "editable")
    card_title.setAttribute("data-placeholder", "Title...")
    // ===============
    // ADD EVENT LISTENER TO UPDATE TITLE VIA API CALL
    card.title.addEventListener

    card_text = document.createElement("div")
    card_text.contentEditable = "plaintext-only"
    card_text.id = card.id + "-text"
    card_text.classList.add("kanban-card-text", "editable")
    card_text.setAttribute("data-placeholder", "Type text here...")
    // ===============
    // ADD EVENT LISTENER TO UPDATE TEXT VIA API CALL
    
    card.append(header, card_title, card_text)
    return { card, card_title }
}

function createSlot(column_id) {
    slot = document.createElement("div")
    slot.classList.add("kanban-column-slot", "dropzone")
    index = document.querySelectorAll(`#${column_id} .kanban-column-slot`).length
    slot.setAttribute("data-index", index)
    slot.setAttribute("data-parent", column_id)
    slot = makeDropZone(slot)
    return slot
}

async function addCard(column_id){
    parent = document.getElementById(column_id + "-container-cards")
    const { card, card_title } = await createCard(column_id)
    // parent.append(card, slot)
    parent.append(card)
    card_title.focus()
}

function createCardButton() {
    button = document.createElement("div")
    // button.onclick = addCard
    button.addEventListener("click", function(e) {
        addCard(e.currentTarget.getAttribute("data-parent"))
    })
    button.textContent = "+"
    button.classList.add("add-button", "kanban-button")
    return button
}

function createDeleteButton(entity) {
    button = document.createElement("div")
    button.addEventListener("click", async function(e) {
        id = e.currentTarget.getAttribute("data-parent")
        if (entity == "column") {
            col_id = id.match("[0-9]+")[0]
            body = {
                status: "ok"
            }
            response = await request(
                window.location.pathname + "columns/" + col_id,
                "DELETE",
                body
            )
        } else if (entity == "card") {
            obj = document.getElementById(id)
            col_id = obj.parent.id.match("[0-9]+")[0]
            card_id = id.match("[0-9]+")
            body = {
                status: "ok"
            }
            response = await request(
                window.location.pathname + "columns/" + col_id + "/card/" + card_id,
                "DELETE",
                body
            )
        }
        document.getElementById(id).remove()
    })

    button.textContent = "×"
    button.classList.add("delete-button", "kanban-button")
    return button
}

function makeDropZone(elem) {
    elem.addEventListener("dragover", (event) => {
        // prevent default to allow drop
        event.preventDefault();
    });

    elem.addEventListener("dragenter", (event) => {
        // highlight potential drop target when the draggable element enters it
        if (event.target.classList.contains("dropzone")) {
        event.target.classList.add("dragover");
        }
    });

    elem.addEventListener("drop", (event) => {
        // prevent default action (open as link for some elements)
        event.preventDefault();
        // move dragged element to the selected drop target
        if (event.target.classList.contains("dropzone")) {
            event.target.classList.remove("dragover");
            parent_id = event.target.getAttribute("data-parent")
            index = event.target.getAttribute("data-index")
            parent = document.getElementById(parent_id + "-container-cards")

            parent.appendChild(dragged)
            children = parent.querySelectorAll(".kanban-card")

            new_children = []

            children.forEach(child => {
                console.log("removing", child)
                child.remove()
            });

            for (i = 0; i <= children.length; i++) {
                if (i == index) {
                    new_children.push(dragged)
                }
                if (i != index && dragged == children[i]) {
                    continue
                }
                else if (i < children.length) {
                    new_children.push(children[i])
                }
            };
            new_children.forEach(child => {
                parent.appendChild(child)
            })

            tidyColumn()
          // =========================
          // NEED TO ADD API REQUEST TO UPDATE PARENT COLUMN ID
          // dragged HAS ACCESS TO CARD ID AND COLUMN ID PRESENT IN DROPZONE
        }
    });

    elem.addEventListener("dragleave", (event) => {
        // reset background of potential drop target when the draggable element leaves it
        if (event.target.classList.contains("dropzone")) {
        event.target.classList.remove("dragover");
        }
    });

    return elem
}

async function addColumn() {
    parent = document.querySelector("#kanban-container-columns")
    column = await createColumn()

    parent.appendChild(column)
    return
}

function generateSlots() {
    columns = document.querySelectorAll(".kanban-column")

    columns.forEach(column => {
        card_container = document.getElementById(column.id + "-container-cards")
        cards = card_container.querySelectorAll(".kanban-card")
        slots = card_container.querySelectorAll(".kanban-column-slot")

        slots.forEach(slot => {
            slot.remove()
        });
        cards.forEach(card => {
            card.remove()
            if (card == dragged) {
                card_container.append(card)
            } else {
                card_container.append(createSlot(column.id), card)
            };
        });
        
        card_container.append(createSlot(column.id))
    });
}

async function tidyColumn() {
    console.log("tidy column called")
    columns = document.querySelectorAll(".kanban-column")
    console.log(columns)

    columns.forEach(column => {
        column_id = column.id.match("[0-9]+")[0]
        card_container = document.getElementById(column.id + "-container-cards")
        slots = card_container.querySelectorAll(".kanban-column-slot")

        slots.forEach(slot => {
            slot.remove()
        });
        positions = []
        i = 0
        card_container.querySelectorAll(".kanban-card").forEach(card => {
            card.setAttribute("data-position", i)
            temp = {
                id: card.id.match("[0-9]+")[0],
                position: i
            }
            positions.push(temp)
            i++
        });
        body = {
            status: "ok",
            positions: positions
        }

        request(window.location.pathname + "column/" + column_id + "/cards", "PATCH", body)
    });
}