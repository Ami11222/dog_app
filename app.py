import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai

# 環境変数をロード
load_dotenv()

app = Flask(__name__)

# Google Gemini APIキーの設定
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise SystemExit("ERROR: 環境変数 GOOGLE_API_KEY が見つかりません。")

# Geminiモデルの初期化
genai.configure(api_key=api_key) # ここでAPIキーを設定
client = genai.GenerativeModel(model_name="gemini-2.5-flash") # 最新のFlashモデルを使用

@app.route("/", methods=["GET"])
def index():
    """
    アプリケーションのメインページ（フロントエンド）をレンダリングします。
    POSTリクエストはJavaScript経由で /chat エンドポイントに送られます。
    """
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    """
    フロントエンドから送信されたペット情報とユーザーのメッセージを受け取り、
    Google Gemini APIを使ってお出かけプランや応答を生成して返します。
    """
    data = request.json
    pet_info = data.get("petInfo", {})
    user_message = data.get("message", "")
    
    if not user_message:
        return jsonify({"response": "メッセージが入力されていません。"})

    # プロンプトの構築
    prompt_parts = []
    prompt_parts.append("あなたは愛犬と飼い主のお出かけプランを提案するAIアシスタントです。\n")
    prompt_parts.append("以下の愛犬の情報と飼い主からのメッセージを元に、最適な提案をしてください。\n")
    prompt_parts.append("簡潔に、しかし具体的に、親しみやすい言葉遣いで回答してください。\n")
    prompt_parts.append("--- 愛犬の情報 ---\n")
    for key, value in pet_info.items():
        if value: # 値が存在する場合のみプロンプトに追加
            # キーを読みやすい日本語に変換 (MyPETフォームのIDと一致させる)
            japanese_key = {
                "dog_name": "名前",
                "breed": "犬種",
                "gender": "性別",
                "age": "年齢",
                "weight": "体重",
                "coat_type": "毛の長さ/種類",
                "neutered_spayed": "避妊・去勢の有無",
                "allergies": "アレルギー",
                "medical_history": "既往歴・持病",
                "personality": "性格",
                "dog_interaction": "他の犬との交流",
                "human_interaction": "人との交流",
                "barking_tendency": "吠えやすさ",
                "biting_habit": "噛み癖の有無",
                "walk_frequency_time": "散歩の頻度と時間",
                "exercise_level": "運動量",
                "likes_water_play": "水遊びが好きか",
                "car_sickness": "車酔いの有無",
                "can_stay_alone": "お留守番の可否と時間",
                "training_status": "しつけの状況",
                "owner_residence": "飼い主の居住地",
                "owner_transportation": "飼い主の交通手段",
            }.get(key, key) # マッピングにない場合は元のキーを使用
            prompt_parts.append(f"{japanese_key}: {value}\n")
    
    prompt_parts.append(f"\n--- 飼い主からのメッセージ ---\n{user_message}\n")
    prompt_parts.append("\n上記の情報から、愛犬に寄り添った最適なアドバイス、お出かけプラン、関連情報などを提案してください。")

    final_prompt = "".join(prompt_parts)

    try:
        response = client.generate_content(final_prompt)
        ai_response_text = getattr(response, "text", "AIからの応答がありませんでした。")
    except Exception as e:
        print(f"Gemini APIエラー: {e}")
        ai_response_text = "AIとの通信中にエラーが発生しました。時間を置いて再度お試しください。"
        
    return jsonify({"response": ai_response_text})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)