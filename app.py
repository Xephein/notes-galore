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

@app.route("/board/<board_id>/columns/", methods=["POST", "DELETE"])
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
    elif request.method == "DELETE":
        data = request.get_json()
        if data["status"] != "ok":
            return {
                "status": "error",
                "msg": "Error in request status."
            }

        column_id = data["column_id"]
        sql_delete("columns", column_id, True)

        response = {
            "status": "ok"
        }
        return response

@app.route("/board/<board_id>/columns/<column_id>/", methods=["PATCH"])
def column(board_id, column_id):
    if request.method == "PATCH":
        data = request.get_json()
        if data["status"] != "ok":
            return {
                "status": "error",
                "msg": "Error in request status."
            }
        col_id = sql_update("columns", column_id, "title", data["title"], autocommit=True)
        
        if col_id["status"] != "ok":
            return {
                "status": "error",
                "msg": f"Column update failed: {col_id["msg"]}"
            }
        return {
            "status": "ok",
            "card_id": col_id["result"]
        }

@app.route("/board/<board_id>/column/<column_id>/cards/", methods=["POST"])
def cards(board_id, column_id):
    if request.method == "POST":
        data = request.get_json()
        if data["status"] != "ok":
            return {
                "status": "error",
                "msg": "Error in request status."
            }
        
        card_id = sql_insert("cards", "column_id", column_id, True)
        if card_id["status"] != "ok":
            return {
                "status": "error",
                "msg": f"Card insertion failed: {card_id["msg"]}"
            }
        response = {
            "status": "ok",
            "card_id": card_id["result"]
        }
        return response


if __name__ == "__main__":
    app.run(debug=True)