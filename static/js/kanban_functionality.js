function createCard() {
    card = document.createElement("div")
    // This will need to become an ID received from backend.
    card.id = "card-" + (document.querySelectorAll("[id*=card-]").length + 1) 
    card.classList.add("kanban-card", "draggable")
    card.draggable = "true"

    card.addEventListener("dragstart", (event) => {
        // store a ref. on the dragged elem
        dragged = event.target;
        // make it half transparent
        event.target.classList.add("dragging");
    });

    card.addEventListener("dragend", (event) => {
        event.target.classList.remove("dragging")
    });

    header = document.createElement("div")
    header.id = card.id + "-header"
    header.classList.add("kanban-card-header")
    console.log(header)

    grab = document.createElement("div")
    grab.classList.add("kanban-card-grab")
    grab.textContent = "°°°"

    button = createDeleteButton()
    button.setAttribute("data-parent", card.id)

    header.append(grab, button)

    card_title = document.createElement("div")
    card_title.contentEditable = "plaintext-only"
    card_title.id = card.id + "-title"
    card_title.classList.add("kanban-card-title", "editable")
    card_title.setAttribute("data-placeholder", "Title...")

    card_text = document.createElement("div")
    card_text.contentEditable = "plaintext-only"
    card_text.id = card.id + "-text"
    card_text.classList.add("kanban-card-text", "editable")
    card_text.setAttribute("data-placeholder", "Type text here...")
    
    card.append(header, card_title, card_text)
    return card
}

function addCard(parent_id){
    parent = document.getElementById(parent_id)
    card = createCard()

    parent.appendChild(card)
    tidy()
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

function createDeleteButton() {
    button = document.createElement("div")
    button.addEventListener("click", function(e) {
        document.getElementById(e.currentTarget.getAttribute("data-parent")).remove()
    })
    button.textContent = "×"
    button.classList.add("delete-button", "kanban-button")
    return button
}

function createColumn() {
    column = document.createElement("div")
    // get from database
    column.id = "col-" + (document.querySelectorAll("[id*=col-]").length + 1)
    column.name = column.id
    column.classList.add("kanban-column", "dropzone")

    column.addEventListener("dragover", (event) => {
        // prevent default to allow drop
        event.preventDefault();
    });

    column.addEventListener("dragenter", (event) => {
        // highlight potential drop target when the draggable element enters it
        if (event.target.classList.contains("dropzone")) {
        event.target.classList.add("dragover");
        }
    });

    column.addEventListener("drop", (event) => {
        // prevent default action (open as link for some elements)
        event.preventDefault();
        // move dragged element to the selected drop target
        if (event.target.classList.contains("dropzone")) {
        event.target.classList.remove("dragover");
        event.target.appendChild(dragged);
        }
    });

    column.addEventListener("dragleave", (event) => {
        // reset background of potential drop target when the draggable element leaves it
        if (event.target.classList.contains("dropzone")) {
        event.target.classList.remove("dragover");
        }
    });


    header = document.createElement("div")
    header.id = column.id + "-header"
    header.classList.add("kanban-column-header")

    column_name = document.createElement("div")
    column_name.contentEditable = "plaintext-only"
    column_name.id = column.id + "-name"
    column_name.classList.add("kanban-column-name")
    column_name.setAttribute("data-placeholder", "Name...")

    delete_button = createDeleteButton()
    delete_button.setAttribute("data-parent", column.id)
    
    header.append(column_name, delete_button)

    add_button = createCardButton()
    add_button.setAttribute("data-parent", column.id)

    column.append(header, add_button)

    return column
}

function addColumn() {
    parent = document.querySelector("#kanban-container-columns")
    column = createColumn()

    parent.appendChild(column)
    return
}

function tidy() {
    return
}