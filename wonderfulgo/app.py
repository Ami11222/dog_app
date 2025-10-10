import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template, request
import google.generativeai as genai

app = Flask(__name__)

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise SystemExit("ERROR: 環境変数 GOOGLE_API_KEY が見つかりません。")

client = genai.GenerativeModel(model_name="gemini-2.5-flash")

@app.route("/", methods=["GET", "POST"])
def index():
    plan = None
    if request.method == "POST":
        # 1. わんちゃんの基本情報
        dog_name = request.form.get("dog_name")
        breed = request.form.get("breed")
        gender = request.form.get("gender")
        age = request.form.get("age")
        weight = request.form.get("weight")
        coat_type = request.form.get("coat_type")
        neutered_spayed = request.form.get("neutered_spayed")
        allergies = request.form.get("allergies")
        medical_history = request.form.get("medical_history")

        # 2. わんちゃんの性格・行動特性
        personality = request.form.get("personality")
        dog_interaction = request.form.get("dog_interaction")
        human_interaction = request.form.get("human_interaction")
        barking_tendency = request.form.get("barking_tendency")
        biting_habit = request.form.get("biting_habit")
        walk_frequency_time = request.form.get("walk_frequency_time")
        exercise_level = request.form.get("exercise_level")
        likes_water_play = request.form.get("likes_water_play")
        car_sickness = request.form.get("car_sickness")
        can_stay_alone = request.form.get("can_stay_alone")
        training_status = request.form.get("training_status")

        # 3. 飼い主さんの情報・希望
        residence = request.form.get("residence")
        transportation = request.form.get("transportation")
        
        # チェックボックスは複数選択される可能性があるので request.form.getlist() を使う
        place_type_list = request.form.getlist("place_type")
        place_type_other = request.form.get("place_type_other")
        if place_type_other:
            place_type_list.append(place_type_other) # その他の項目を追加
        place_type = ", ".join(place_type_list) if place_type_list else "特になし"
        
        purpose = request.form.get("purpose")
        stay_duration = request.form.get("stay_duration")
        budget = request.form.get("budget")
        companions = request.form.get("companions")
        
        # チェックボックスは複数選択される可能性があるので request.form.getlist() を使う
        importance_list = request.form.getlist("importance")
        importance_other = request.form.get("importance_other")
        if importance_other:
            importance_list.append(importance_other) # その他の項目を追加
        importance = ", ".join(importance_list) if importance_list else "特になし"

        # プロンプトの構築
        prompt_parts = []
        prompt_parts.append("以下の情報に基づき、愛犬と飼い主にとって最適な一日のお出かけプランを具体的に提案してください。\n")
        prompt_parts.append("--- わんちゃんの基本情報 ---\n")
        if dog_name: prompt_parts.append(f"名前: {dog_name}\n")
        if breed: prompt_parts.append(f"犬種: {breed}\n")
        if gender: prompt_parts.append(f"性別: {gender}\n")
        if age: prompt_parts.append(f"年齢: {age}歳\n")
        if weight: prompt_parts.append(f"体重: {weight}kg\n")
        if coat_type: prompt_parts.append(f"毛の長さ/種類: {coat_type}\n")
        if neutered_spayed: prompt_parts.append(f"避妊・去勢の有無: {neutered_spayed}\n")
        if allergies: prompt_parts.append(f"アレルギー: {allergies}\n")
        if medical_history: prompt_parts.append(f"既往歴・持病: {medical_history}\n")

        prompt_parts.append("\n--- わんちゃんの性格・行動特性 ---\n")
        if personality: prompt_parts.append(f"性格: {personality}\n")
        if dog_interaction: prompt_parts.append(f"他の犬との交流: {dog_interaction}\n")
        if human_interaction: prompt_parts.append(f"人との交流: {human_interaction}\n")
        if barking_tendency: prompt_parts.append(f"吠えやすさ: {barking_tendency}\n")
        if biting_habit: prompt_parts.append(f"噛み癖の有無: {biting_habit}\n")
        if walk_frequency_time: prompt_parts.append(f"散歩の頻度と時間: {walk_frequency_time}\n")
        if exercise_level: prompt_parts.append(f"運動量: {exercise_level}\n")
        if likes_water_play: prompt_parts.append(f"水遊びが好きか: {likes_water_play}\n")
        if car_sickness: prompt_parts.append(f"車酔いの有無: {car_sickness}\n")
        if can_stay_alone: prompt_parts.append(f"お留守番の可否と時間: {can_stay_alone}\n")
        if training_status: prompt_parts.append(f"しつけの状況: {training_status}\n")

        prompt_parts.append("\n--- 飼い主さんの情報・希望 ---\n")
        if residence: prompt_parts.append(f"居住地: {residence}\n")
        if transportation: prompt_parts.append(f"交通手段: {transportation}\n")
        if place_type: prompt_parts.append(f"行きたい場所のタイプ: {place_type}\n")
        if purpose: prompt_parts.append(f"お出かけの目的: {purpose}\n")
        if stay_duration: prompt_parts.append(f"滞在時間: {stay_duration}\n")
        if budget: prompt_parts.append(f"予算感: {budget}\n")
        if companions: prompt_parts.append(f"同行者: {companions}\n")
        if importance: prompt_parts.append(f"重視する点: {importance}\n")
        
        # 最終的なプロンプト
        final_prompt = "".join(prompt_parts)

        response = client.generate_content(final_prompt)
        plan = getattr(response, "text", str(response))
    return render_template("index.html", plan=plan)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)