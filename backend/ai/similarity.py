"""Tıbbi hafıza benzerlik motoru: kosinüs benzerliği + eşanlamlı genişletme."""

import math
import re

_WORDS = re.compile(r"\w+")

# Tıbbi terim -> ilişkili kavram genişletmeleri (bağlamsal eşleşmeyi güçlendirir)
MEDICAL_EXPANSIONS = {
    "hipertansiyon": "kalp tansiyon damar kan",
    "egzama": "cilt deri kasinti dokuntu",
    "diyabet": "seker insulin endokrin",
    "nefes darligi": "akciger solunum oksijen kalp",
    "gogus sikismasi": "kalp damar kriz agri",
    "bas agrisi": "beyin migren sinir",
    "reflu": "mide sindirim girtlak yanma",
}


def get_cosine_similarity(text1: str, text2: str) -> float:
    def get_word_freq(text: str):
        freq = {}
        for word in _WORDS.findall(text.lower()):
            freq[word] = freq.get(word, 0) + 1
        return freq

    vec1 = get_word_freq(text1)
    vec2 = get_word_freq(text2)

    intersection = set(vec1.keys()) & set(vec2.keys())
    dot_product = sum(vec1[x] * vec2[x] for x in intersection)

    sum1 = sum(v ** 2 for v in vec1.values())
    sum2 = sum(v ** 2 for v in vec2.values())
    denominator = math.sqrt(sum1) * math.sqrt(sum2)

    if not denominator:
        return 0.0
    return float(dot_product) / denominator


def expand_medical_terms(text: str) -> str:
    lowered = text.lower()
    expanded = lowered
    for term, exp in MEDICAL_EXPANSIONS.items():
        if term in lowered:
            expanded += " " + exp
    return expanded


def compute_history_alerts(patient) -> list:
    """Hastanın geçmiş öyküsü ile güncel semptomları arasında bağlamsal uyarılar üretir."""
    alerts = []
    symptom_texts = [f.finding for f in patient.symptom_findings]
    current_symptoms_str = " ".join(symptom_texts)
    if not current_symptoms_str:
        return alerts

    for item in patient.medical_history:
        history_str = f"{item.category} {item.title} {item.details}"
        similarity = get_cosine_similarity(
            expand_medical_terms(current_symptoms_str),
            expand_medical_terms(history_str),
        )
        if similarity > 0.12:
            alerts.append(
                f"KRİTİK UYARI: Hastanın geçmişindeki '{item.title}' öyküsü ile "
                f"güncel şikayetleri ({', '.join(symptom_texts[:2])}) arasında "
                f"bağlamsal benzerlik (%{int(similarity * 100)}) tespit edilmiştir."
            )
    return alerts
