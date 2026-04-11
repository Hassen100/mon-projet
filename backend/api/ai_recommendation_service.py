import os
from typing import List

import requests


class SEORecommendationService:
    """Generate page-level SEO recommendations from structured metrics."""

    PAGE_SYSTEM_PROMPT = """
Tu es un expert SEO senior specialise dans l'analyse de donnees analytics et l'optimisation de contenu.
Tu recois des indicateurs d'une page web (taux de rebond, duree moyenne, sessions, position d'un mot-cle, impressions, CTR).
Tu dois produire des recommandations precises, actionnables et hierarchisees.
Ne donne jamais de conseils generiques comme "ameliorez le contenu".
Chaque recommandation doit mentionner un levier concret lie aux metriques fournies.
Format obligatoire :
- 3 a 5 puces courtes
- chaque puce commence par un emoji
- la priorite doit apparaitre explicitement : Priorite haute, Priorite moyenne ou Priorite basse
- aucune introduction
- aucune conclusion
- aucune section explicative
- ne jamais mentionner que les donnees sont fake, d'exemple ou simulees
""".strip()

    def __init__(self) -> None:
        self.provider = os.getenv("AI_PROVIDER", "ollama").strip().lower()
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate").strip()
        self.ollama_model = os.getenv("OLLAMA_MODEL", "mistral").strip()

    def recommend_page(
        self,
        *,
        url: str,
        bounce_rate: float,
        avg_duration: str,
        sessions: int,
        position,
        impressions: int,
        ctr: float,
    ) -> List[str]:
        prompt = self._build_page_prompt(
            url=url,
            bounce_rate=bounce_rate,
            avg_duration=avg_duration,
            sessions=sessions,
            position=position,
            impressions=impressions,
            ctr=ctr,
        )

        if self.provider == "ollama":
            try:
                raw_text = self._call_ollama(prompt)
                parsed = self._extract_bullets(raw_text)
                if parsed:
                    return parsed
            except Exception:
                pass

        return self._fallback_page_recommendations(
            url=url,
            bounce_rate=bounce_rate,
            avg_duration=avg_duration,
            sessions=sessions,
            position=position,
            impressions=impressions,
            ctr=ctr,
        )

    def _build_page_prompt(
        self,
        *,
        url: str,
        bounce_rate: float,
        avg_duration: str,
        sessions: int,
        position,
        impressions: int,
        ctr: float,
    ) -> str:
        return f"""
Analyse la page suivante :

URL : {url}
Taux de rebond : {bounce_rate}%
Duree moyenne de session : {avg_duration}
Sessions (30 derniers jours) : {sessions}
Position moyenne du mot-cle principal : {position if position not in (None, '') else 'non renseigne'}
Impressions : {impressions}
CTR : {ctr}%

Propose 3 a 5 recommandations concretes pour ameliorer le SEO et l'engagement de cette page.
""".strip()

    def _call_ollama(self, prompt: str) -> str:
        full_prompt = f"{self.PAGE_SYSTEM_PROMPT}\n\n{prompt}"
        response = requests.post(
            self.ollama_url,
            json={
                "model": self.ollama_model,
                "prompt": full_prompt,
                "stream": False,
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        return (payload.get("response") or "").strip()

    def _extract_bullets(self, text: str) -> List[str]:
        lines = []
        for raw_line in text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith(("-", "*", "•")):
                line = line[1:].strip()
            lines.append(line)

        filtered = [line for line in lines if self._looks_like_bullet(line)]
        if len(filtered) >= 3:
            return filtered[:5]
        return lines[:5]

    def _looks_like_bullet(self, line: str) -> bool:
        return "Priorite " in line or any(
            line.startswith(prefix)
            for prefix in ("🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚡", "📈", "🧭", "🛠️", "🧩")
        )

    def _fallback_page_recommendations(
        self,
        *,
        url: str,
        bounce_rate: float,
        avg_duration: str,
        sessions: int,
        position,
        impressions: int,
        ctr: float,
    ) -> List[str]:
        recommendations: List[str] = []

        if bounce_rate >= 75:
            recommendations.append(
                "🔴 Priorite haute : placez un bloc de reponse immediate au-dessus de la ligne de flottaison sur "
                f"{url} avec 3 ancres internes visibles pour reduire les sorties rapides liees au rebond a {bounce_rate}%."
            )

        if self._duration_is_low(avg_duration):
            recommendations.append(
                "🟠 Priorite haute : ajoutez un sommaire cliquable et un bloc FAQ de 3 questions des les 400 premiers pixels "
                f"pour faire remonter la duree moyenne au-dela de {avg_duration}."
            )

        if position not in (None, "", "non renseigne"):
            try:
                numeric_position = float(position)
            except (TypeError, ValueError):
                numeric_position = None

            if numeric_position is not None and 8 <= numeric_position <= 20:
                recommendations.append(
                    "🟡 Priorite moyenne : retravaillez le title avec le mot-cle principal en debut et ajoutez un H2 cible "
                    f"sur l'intention secondaire, car la position moyenne {numeric_position:.0f} est en zone de bascule page 1."
                )

        if impressions >= 1000 and ctr <= 2:
            recommendations.append(
                "🔵 Priorite moyenne : testez une meta description orientee benefice + preuve avec l'annee en cours et "
                f"un angle precis, car {impressions} impressions pour {ctr}% de CTR signalent surtout un probleme de snippet."
            )

        if sessions >= 1000:
            recommendations.append(
                "🟢 Priorite basse : inserez 2 liens internes contextuels vers des pages transactionnelles ou guides "
                f"proches pour mieux capter les {sessions} sessions deja acquises et augmenter les pages vues par visite."
            )

        if len(recommendations) < 3:
            recommendations.append(
                "🟣 Priorite basse : ajoutez un schema FAQ ou Article selon le type de page pour enrichir le snippet "
                "et augmenter la probabilite de clic depuis les resultats Google."
            )

        return recommendations[:5]

    def _duration_is_low(self, avg_duration: str) -> bool:
        if not avg_duration:
            return False

        value = str(avg_duration).strip().lower()
        if value.isdigit():
            return int(value) < 60

        if ":" in value:
            parts = value.split(":")
            if len(parts) == 2 and all(part.isdigit() for part in parts):
                minutes, seconds = parts
                return (int(minutes) * 60 + int(seconds)) < 60

        digits = "".join(char for char in value if char.isdigit())
        if digits:
            try:
                return int(digits) < 60
            except ValueError:
                return False

        return False
