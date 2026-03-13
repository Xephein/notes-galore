from flask import Flask, render_template, g, request, jsonify, redirect, url_for
import sqlite3

from utils.db import *

app = Flask(__name__)

DATABASE = "instance/app.db"

@app.teardown_appcontext
def teardown_db(exception):
    close_db(exception)

@app.cli.command("init-db")
def init_db_command():
    init_db()
    print("Initialized the database.")

@app.route("/")
def index():
    where = {"active": 1}
    boards = sql_select(
        "boards", 
        ["id, title"], 
        where
    )["result"]
    return render_template("index.html", boards=boards)

@app.route("/boards/", methods=["POST"])
def boards():
    if request.method == "POST":
        data = request.get_json()

        board_id = sql_insert("boards", "title", data["boardname"], autocommit=True)["result"]
        response = {
            "status": "ok",
            "board_id": board_id,
            "redirect": url_for('board', board_id=board_id)
        }
        return jsonify(response)
    return "invalid access method."

@app.route("/board/<board_id>/", methods=["GET", "POST", "DELETE"])
def board(board_id):
    if request.method == "GET":
        where = {
            "board_id": board_id,
            "active": 1}
        order_by = {
            "position": "ASC"
        }
        columns = sql_select(
            "columns", 
            ["id", "title", "position"],
            where,
            order_by
        )["result"]
        
        for col in columns:
            where = {
                "column_id": col["id"],
                "active": 1
            }
            cards = sql_select(
                "cards",
                ["id", "title", "content", "position"],
                where,
                order_by
            )["result"]
            col["cards"] = cards
        return render_template("board.html", columns=columns)

@app.route("/board/<board_id>/columns/", methods=["POST"])
def columns(board_id):
    if request.method == "POST":
        data = request.get_json()
        if data["status"] != "ok":
            return {
                "status": "error",
                "msg": "Error in request status."
            }

        column_id = sql_insert(
            "columns", 
            ["board_id", "position"],
            [board_id, data["position"]], 
            True
        )
        if column_id["status"] != "ok":
            return {
                "status": "error",
                "msg": f"Column insertion failed: {column_id["msg"]}"
            }
        response = {
            "status": "ok",
            "column_id": column_id["result"]
        }
        return response


@app.route("/board/<board_id>/columns/<column_id>/", methods=["PATCH", "DELETE"])
def column(board_id, column_id):
    if request.method == "PATCH":
        data = request.get_json()
        if data["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": "Error in request status."
            })
        col_id = sql_update("columns", column_id, "title", data["title"], autocommit=True)
        
        if col_id["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": f"Column update failed: {col_id["msg"]}"
            })
        return jsonify({
            "status": "ok",
            "card_id": col_id["result"]
        })
    elif request.method == "DELETE":
        data = request.get_json()
        if data["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": "Error in request status."
            })

        sql_delete("columns", column_id, True)

        response = jsonify({
            "status": "ok"
        })
        return response

@app.route("/board/<board_id>/column/<column_id>/cards/", methods=["POST", "PATCH"])
def cards(board_id, column_id):
    if request.method == "POST":
        data = request.get_json()
        if data["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": "Error in request status."
            })
        
        card_id = sql_insert(
            "cards",
            ["column_id", "position"],
            [column_id, data["position"]],
            True
        )
        if card_id["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": f"Card insertion failed: {card_id["msg"]}"
            })
        return jsonify({
            "status": "ok",
            "card_id": card_id["result"]
        })

    elif request.method == "PATCH":
        data = request.get_json()
        if data["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": "Error in request status."
            })
        outcome = sql_updatemany("cards", data["positions"], autocommit=True)

        if outcome["status"] != "ok":
            print(outcome)
            return jsonify({
                "status": "error",
                "msg": "unexpected error occured"
            })
        return jsonify({"status": "ok"})
    
@app.route("/board/<board_id>/columns/<column_id>/cards/<card_id>", methods=["PATCH", "DELETE"])
def card(board_id, column_id, card_id):
    if request.method == "PATCH":
        pass
    elif request.method == "DELETE":
        data = request.get_json()
        if data["status"] != "ok":
            return jsonify({
                "status": "error",
                "msg": "Error in request status."
            })
        sql_delete("cards", card_id, True)

        return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)