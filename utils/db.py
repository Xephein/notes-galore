# db.py
from flask import g, current_app
import re
import sqlite3

DATABASE = "instance/app.db"

def dict_factory(cursor, row):
    fields = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(fields, row)}

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = dict_factory
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

def init_db():
    db = get_db()

    with current_app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf8"))

def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def get_cur():
    con = get_db()
    return con.cursor()

def query_db(query, args=(), one=False, autocommit=True):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    if autocommit:
        g.db.commit()
    return (rv[0] if rv else None) if one else rv

def sql_select(table, columns, where=None, order_by=None):
    if not isinstance(columns, list):
        columns = list(columns)
    query = f"SELECT {", ".join(columns)} FROM {table}"
    if not isinstance(where, dict):
        return {
            "status": "error",
            "msg": "Inappropriate datatype for arg: where (needs to be dict)."
        }
    args = ()
    if where:
        query += f"\nWHERE {" AND ".join([f"{x} = ?" for x in where])}"
        args = tuple(where.values())

    if order_by:
        query += f"\nORDER BY {",".join([" ".join([key, order_by[key]]) for key in order_by])}"

    results = query_db(query, args)
    return {
        "status": "ok",
        "msg": None,
        "result": results
    }

def sql_insert(table, columns, values, autocommit=False):
    if not isinstance(columns, list):
        columns = [columns]
    if not isinstance(values, list):
        values = [values]
    if len(columns) != len(values):
        return {
            "status": "error",
            "msg": "Number of columns and values are unequal."
        }
    
    query = f"""INSERT INTO {table} ({", ".join(columns)})
    VALUES ({", ".join(["?" for x in values])})"""

    cursor = get_cur()
    cursor.execute(query, tuple(values))
    inserted = cursor.lastrowid

    if autocommit:
        g.db.commit()
    
    cursor.close()

    return {
        "status": "ok",
        "msg": None,
        "result": inserted
    }

def sql_update(table, row_id, columns, values, autocommit=False, cur=None):
    if not isinstance(columns, list):
        columns = [columns]
    if not isinstance(values, list):
        values = [values]
    if len(values) != len(columns):
        return {
            "status": "error",
            "msg": "Number of columns and values are unequal."
        }
    values.append(row_id)
    query = f"""UPDATE {table}
    SET {",".join([column + " = ?" for column in columns])}
    WHERE id = ?"""

    print(query)
    if cur:
        cursor = cur
    else:
        cursor = get_cur()
    
    cursor.execute(query, tuple(values))

    if autocommit:
        g.db.commit()
    
    if cur is None:
        cursor.close()

    return {
        "status": "ok",
        "result": row_id
    }

def sql_updatemany(table, updates, autocommit=False):
    cursor = get_cur()
    for row in updates:
        row_id = row.pop("id")
        columns = list(row.keys())
        values = list(row.values())
        res = sql_update(table, row_id, columns, values, autocommit=False, cur=cursor)
        if res["status"] != "ok":
            res["info"] = f"row_id: {row_id}, columns: {columns}, values: {values}"
            return res
    
    if autocommit:
        g.db.commit()
    
    cursor.close()

    return {
        "status": "ok",
    }

    


def sql_delete(table, col_id, autocommit=False):
    if not isinstance(col_id, tuple):
        col_id = (int(col_id), )
    query = f"""DELETE FROM {table} 
    WHERE id = ?"""

    cursor = get_cur()
    print(query)
    cursor.execute(query, col_id)

    if autocommit:
        g.db.commit()
    
    cursor.close()

    return {
        "status": "ok"
    }

