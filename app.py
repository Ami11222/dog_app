import os
from flask import Flask, render_template, request
from google import genai

app = Flask(__name__)

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise SystemExit("ERROR: 環境変数 GOOGLE_API_KEY が見つかりません。")

client = genai.Client(api_key=api_key)

@app.route("/", methods=["GET", "POST"])
def index():
    plan = None
    if request.method == "POST":
        breed = request.form.get("breed")
        age = request.form.get("age")
        personality = request.form.get("personality")

        prompt = f"犬種: {breed}, 年齢: {age}, 性格: {personality} に合うお出かけプランを提案してください。"
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        plan = getattr(response, "text", str(response))
    return render_template("index.html", plan=plan)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
