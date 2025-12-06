import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from catboost import CatBoostClassifier

# === Paths ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))          # nirogya-ml/
DATA_PATH = os.path.join(BASE_DIR, "dataset", "nirogya_training_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODELS_DIR, "disease_prediction_model.joblib")
LABEL_ENCODER_PATH = os.path.join(MODELS_DIR, "label_encoder.joblib")

def load_data():
    df = pd.read_csv(DATA_PATH)

    # Make sure these columns match your CSV exactly
    categorical_features = ["district", "location", "primary_source"]
    symptom_features = [
        "diarrhea",
        "vomiting",
        "fever",
        "abdominal_pain",
        "dehydration",
        "headache",
    ]
    water_features = [
        "ph",
        "turbidity",
        "tds",
        "chlorine",
        "fluoride",
        "nitrate",
        "coliform",
        "temperature",
    ]

    feature_cols = categorical_features + water_features + symptom_features

    X = df[feature_cols].copy()
    y = df["disease_label"].copy()

    return X, y, categorical_features, feature_cols

def train():
    print("Loading data from:", DATA_PATH)
    X, y, cat_cols, feature_cols = load_data()

    # Encode target labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    # Train/validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X,
        y_encoded,
        test_size=0.2,
        random_state=42,
        stratify=y_encoded,
    )

    # CatBoost expects indices of categorical columns
    # based on the order in feature_cols
    cat_feature_indices = [feature_cols.index(col) for col in cat_cols]

    model = CatBoostClassifier(
        iterations=400,
        depth=6,
        learning_rate=0.1,
        loss_function="MultiClass",
        eval_metric="Accuracy",
        verbose=100,
        random_seed=42,
    )

    print("Training CatBoost model...")
    model.fit(
        X_train,
        y_train,
        eval_set=(X_val, y_val),
        cat_features=cat_feature_indices,
        use_best_model=True,
    )

    # Evaluate
    y_pred = model.predict(X_val)
    # CatBoost returns shape (n_samples, 1), flatten it
    y_pred = y_pred.reshape(-1).astype(int)

    acc = accuracy_score(y_val, y_pred)
    print(f"\nValidation Accuracy: {acc:.4f}\n")
    print("Classification Report:")
    target_names = le.inverse_transform(sorted(set(y_encoded)))
    print(
        classification_report(
            y_val,
            y_pred,
            target_names=target_names,
            zero_division=0,
        )
    )

    # Save model + label encoder + feature order
    joblib.dump(model, MODEL_PATH)
    joblib.dump(
        {
            "label_encoder": le,
            "feature_cols": feature_cols,
            "categorical_cols": cat_cols,
        },
        LABEL_ENCODER_PATH,
    )

    print(f"\nSaved model to: {MODEL_PATH}")
    print(f"Saved label encoder + metadata to: {LABEL_ENCODER_PATH}")

if __name__ == "__main__":
    train()
