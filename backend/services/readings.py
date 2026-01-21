import hashlib
import random
from datetime import datetime, timezone

MAJOR_ARCANA = [
    'The Fool', 'The Magician', 'The High Priestess', 'The Empress', 'The Emperor',
    'The Hierophant', 'The Lovers', 'The Chariot', 'Strength', 'The Hermit',
    'Wheel of Fortune', 'Justice', 'The Hanged Man', 'Death', 'Temperance',
    'The Devil', 'The Tower', 'The Star', 'The Moon', 'The Sun',
    'Judgement', 'The World'
]

FLOWER_TIMINGS = [
    'in 1 week', 'in 2 weeks', 'in 1 month', 'in 2 months', 'in 3 months', 'later'
]


def _seed_to_int(seed: str) -> int:
    digest = hashlib.sha256(seed.encode('utf-8')).hexdigest()
    return int(digest[:16], 16)


def build_seed(user_id: str, fortune_type_key: str, date_str: str | None = None) -> str:
    if date_str is None:
        date_str = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    base_key = fortune_type_key
    if fortune_type_key.startswith('today_deep_'):
        base_key = 'today_free'
    return f'{user_id}:{date_str}:{base_key}'


def generate_reading(user_id: str, fortune_type_key: str, input_json: dict | None = None) -> dict:
    base_seed = build_seed(user_id, fortune_type_key)
    base_rng = random.Random(_seed_to_int(base_seed))

    if fortune_type_key.startswith('hexagram_'):
        number = base_rng.randint(1, 64)
        return {
            'type': 'hexagram',
            'number': number,
            'seed': base_seed,
        }

    if fortune_type_key.startswith('celtic_'):
        cards = _draw_cards(base_rng, 10)
        return {
            'type': 'celtic_cross',
            'cards': cards,
            'seed': base_seed,
        }

    if fortune_type_key == 'flower_timing':
        timing = base_rng.choice(FLOWER_TIMINGS)
        return {
            'type': 'flower_timing',
            'timing': timing,
            'seed': base_seed,
        }

    if fortune_type_key == 'triangle_crime':
        cards = _draw_cards(base_rng, 3)
        return {
            'type': 'triangle_warning',
            'cards': cards,
            'seed': base_seed,
        }

    if fortune_type_key == 'no_desc_draw':
        cards = _draw_cards(base_rng, 1)
        return {
            'type': 'no_desc_draw',
            'cards': cards,
            'seed': base_seed,
        }

    if fortune_type_key == 'compatibility':
        cards = _draw_cards(base_rng, 2)
        return {
            'type': 'compatibility',
            'cards': cards,
            'seed': base_seed,
            'input': input_json or {},
        }

    if fortune_type_key.startswith('today_deep_'):
        deep_seed = f'{base_seed}:{fortune_type_key}'
        deep_rng = random.Random(_seed_to_int(deep_seed))
        base_card = _draw_cards(base_rng, 1)[0]
        aspects = {
            'advice': deep_rng.choice(MAJOR_ARCANA),
            'risk': deep_rng.choice(MAJOR_ARCANA),
        }
        return {
            'type': 'today_deep',
            'base_card': base_card,
            'aspects': aspects,
            'seed': base_seed,
            'deep_seed': deep_seed,
        }

    cards = _draw_cards(base_rng, 1)
    return {
        'type': 'single_draw',
        'cards': cards,
        'seed': base_seed,
    }


def _draw_cards(rng: random.Random, count: int) -> list[dict]:
    indices = rng.sample(range(len(MAJOR_ARCANA)), count)
    cards = []
    for idx in indices:
        upright = rng.choice([True, False])
        cards.append({
            'name': MAJOR_ARCANA[idx],
            'upright': upright,
        })
    return cards
