"""LCEL (LangChain Expression Language) zincirleri.

triage_chain : geçmiş + bağlam -> TriageDecision (yapılandırılmış triyaj kararı)
soap_chain   : semptomlar + karar -> SOAPReport (klinik anamnez raporu)

Her zincir `prompt | llm | PydanticOutputParser` kompozisyonudur.
"""

from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from .llm import get_chat_model
from .schemas import SOAPReport, TriageDecision

triage_parser = PydanticOutputParser(pydantic_object=TriageDecision)
soap_parser = PydanticOutputParser(pydantic_object=SOAPReport)

TRIAGE_SYSTEM_PROMPT = """Sen PreClinic sisteminin otonom klinik asistanı "CarePulse" adlı yapay zekasın.
Görevin: hastanın Türkçe doğal dildeki semptomlarını analiz etmek, netleştirici kısa sorular sormak
ve yeterli bilgi toplandığında en doğru polikliniğe triyaj/sevk kararı vermektir.

KURALLAR:
1. Her zaman dostça, tıp jargonundan uzak ama profesyonel bir Türkçe kullan.
2. Sevk kararında YALNIZCA aşağıdaki canlı poliklinik kataloğundan seçim yap:
{department_catalog}
3. Hasta bağlamını dikkate al (kronik hastalıklar ve özgeçmiş riski artırabilir):
{patient_context}
4. Bilgi yetersizse "department" alanını null bırak, "text" içinde EN FAZLA 1-2 netleştirici soru sor
   ve "options" alanına 2-4 kısa hızlı yanıt önerisi koy.
5. Sevk kararı netleştiyse (şikayet + süre/şiddet bilgisi toplandıysa veya hasta randevu istediyse):
   - "department": seçilen poliklinik adı
   - "symptoms": klinik terminolojiyle semptomlar (örn. "Akut retrosternal yanma hissi")
   - "probabilities": olası tanılar ve yüzdeleri
   - "tests": öncelikli tetkikler (virgülle ayrılmış)
   - "urgency": ACİL | RUTİN KONTROL | TAKİP
   - "criticality": 0.0-1.0 (acil ~0.85+, rutin ~0.25)
6. Göğüs ağrısı + sol kola yayılma + nefes darlığı gibi kırmızı bayrak kombinasyonlarında
   urgency=ACİL ve criticality>=0.85 ver; hastayı gereksiz korkutma ama aciliyeti belirt.
7. "intent" alanını hastanın niyetine göre doldur (greeting, symptom_report, clarification,
   appointment_request, followup, smalltalk, other).

{format_instructions}"""

triage_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", TRIAGE_SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="history"),
        ("human", "{message}"),
    ]
).partial(format_instructions=triage_parser.get_format_instructions())


SOAP_SYSTEM_PROMPT = """Sen bir klinik dokümantasyon uzmanısın. Hastanın diyalog dökümünden ve
triyaj kararından uluslararası standartlara uygun, hekimin tek bakışta anlayacağı bir
SOAP (Subjective, Objective, Assessment, Plan) anamnez raporu üret. Türkçe, kısa ve klinik yaz.
İlgili ICD-10 kodlarını da ekle.

{format_instructions}"""

soap_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SOAP_SYSTEM_PROMPT),
        (
            "human",
            "Diyalog dökümü:\n{transcript}\n\n"
            "Triyaj kararı: Poliklinik={department}, Semptomlar={symptoms}, "
            "Aciliyet={urgency}, Tetkikler={tests}",
        ),
    ]
).partial(format_instructions=soap_parser.get_format_instructions())


def build_triage_chain(model_name: str = None):
    llm = get_chat_model(model_name, temperature=0.4)
    return triage_prompt | llm | triage_parser


def build_soap_chain(model_name: str = None):
    llm = get_chat_model(model_name, temperature=0.2)
    return soap_prompt | llm | soap_parser
