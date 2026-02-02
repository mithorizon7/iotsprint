# Translator Guide: IoT Strategy Sprint

## Overview

This guide helps professional translators localize the IoT Strategy Sprint educational game into Russian and Latvian. The game teaches IoT fundamentals through strategic gameplay, using real-world company examples that should remain recognizable across languages.

## Translation Files

### File Locations

- **English (source)**: `client/public/locales/en/translation.json`
- **Russian (to translate)**: `client/public/locales/ru/translation.json`
- **Latvian (to translate)**: `client/public/locales/lv/translation.json`

### File Structure

Translation files are organized hierarchically:

```json
{
  "game": {
    "title": "IoT Strategy Sprint",
    "subtitle": "Learn IoT fundamentals through strategic decision-making"
  },
  "onboarding": {
    "title": "Welcome to IoT Strategy Sprint",
    ...
  }
}
```

## Translation Guidelines

### 1. **Preserve Placeholders**

Variables enclosed in double curly braces must be kept exactly as written:

```json
"roundTitle": "Year {{round}}"
"tokensAvailable": "{{count}} tokens remaining"
```

**Correct Russian translation**:

```json
"roundTitle": "Год {{round}}"
"tokensAvailable": "Осталось токенов: {{count}}"
```

**Incorrect** (placeholder changed):

```json
"roundTitle": "Год {{год}}"  ❌ Don't translate placeholder names
```

### 2. **Company Names and Proper Nouns**

**Keep in English**: Company names, product names, and location names should remain in their original form for brand recognition:

- **Airbus** → Airbus (not Эйрбас)
- **Bosch Energy Platform** → Bosch Energy Platform
- **Rio Tinto** → Rio Tinto
- **Microsoft Connected Vehicle Platform** → Microsoft Connected Vehicle Platform
- **Logidot** → Logidot
- **BrightWorks Operations** → BrightWorks Operations (fictional company name)

### 3. **Technical Terms**

**Consistent terminology** for IoT concepts:

| English                  | Russian                   | Latvian               |
| ------------------------ | ------------------------- | --------------------- |
| IoT (Internet of Things) | IoT (Интернет вещей)      | IoT (lietu internets) |
| Sensor                   | Датчик                    | Sensors               |
| Visibility               | Видимость                 | Redzamība             |
| Early Warning            | Раннее предупреждение     | Agrīna brīdināšana    |
| Predictive Maintenance   | Предиктивное обслуживание | Proaktīvā apkope      |
| Digital Twin             | Цифровой двойник          | Digitālais dvīnis     |
| Emissions                | Выбросы                   | Emisijas              |

### 4. **Context-Aware Descriptors**

While company names stay in English, surrounding descriptive text should be translated for grammatical correctness:

**English**:

```json
"feedback.airbus": "Airbus smart tools"
```

**Russian** (adjective must agree with noun gender):

```json
"feedback.airbus": "умные инструменты Airbus"
```

**Latvian** (similar grammatical considerations):

```json
"feedback.airbus": "Airbus viedo rīku"
```

### 5. **Text Expansion**

**Russian text is typically 30-40% longer than English**. Ensure translations fit within UI constraints:

- Buttons: Keep concise (max ~20 characters)
- Tooltips: Can be longer, but test readability
- Headings: Maintain impact while being clear

**Example**:

- English: "Run My Plan" (11 chars)
- Russian: "Запустить план" (14 chars) ✓
- Avoid: "Запустить выполнение моего плана" (33 chars) ❌ Too long for button

### 6. **Tone and Voice**

Maintain a **professional yet accessible** tone:

- **Informative**, not academic
- **Encouraging**, not patronizing
- **Clear**, not overly technical

**Example - English**:

> "You are the Director of IoT Strategy for BrightWorks Operations."

**Good Russian translation**:

> "Вы — директор по стратегии IoT в BrightWorks Operations."

**Avoid overly formal**:

> "Вы занимаете должность директора по стратегии интернета вещей..." ❌

### 7. **Pluralization**

React-i18next handles plurals automatically. Use the `_other` suffix for plural forms:

**English**:

```json
"tokensAvailable": "{{count}} token remaining",
"tokensAvailable_other": "{{count}} tokens remaining"
```

**Russian** (requires singular, few, many forms):

```json
"tokensAvailable_one": "{{count}} токен",
"tokensAvailable_few": "{{count}} токена",
"tokensAvailable_many": "{{count}} токенов"
```

### 8. **Educational Content**

The game teaches IoT concepts. Ensure translations:

- **Preserve technical accuracy**
- **Maintain learning objectives**
- **Use terminology consistently** across all content

### 9. **Game-Specific Elements**

**Initiative Cards**: Describe real-world IoT implementations. Keep company attributions clear:

**English**:

```json
"title": "Warehouse Flow Tracking",
"description": "Install tags on pallets, forklifts, and vehicles..."
```

**Russian**:

```json
"title": "Отслеживание потоков на складе",
"description": "Установите метки на поддоны, погрузчики и транспортные средства..."
```

**Metrics**: Use standard business terminology:

| English         | Russian        | Latvian            |
| --------------- | -------------- | ------------------ |
| Efficiency      | Эффективность  | Efektivitāte       |
| Sustainability  | Устойчивость   | Ilgtspēja          |
| Complexity Risk | Риск сложности | Sarežģītības risks |

## Translation Workflow

1. **Review English source** (`client/public/locales/en/translation.json`)
2. **Translate** all values while preserving:
   - JSON structure
   - Placeholder syntax `{{variable}}`
   - Company names
3. **Test text length** in context (buttons, headings, tooltips)
4. **Verify consistency** of technical terms
5. **Submit** completed Russian and Latvian files

## Quality Checklist

Before submitting translations, verify:

- [ ] All JSON syntax is valid (no trailing commas, matching brackets)
- [ ] All `{{placeholders}}` are preserved exactly
- [ ] Company names remain in English
- [ ] Technical terms use consistent translations
- [ ] Text fits within UI constraints (test with pseudo-locale if possible)
- [ ] Pluralization forms are provided where needed
- [ ] Tone is professional and accessible
- [ ] No cultural references that wouldn't translate

## Testing Your Translation

Use the **pseudo-locale** (`en-ps`) as a reference for text expansion:

- It shows how much longer text can be (~40% expansion)
- Helps identify UI layout issues before translation

## Questions?

For clarification on:

- **Technical terms**: Check IoT industry standards in your language
- **Company examples**: Keep original English names
- **Context**: Review the English game to understand use cases

## File Format Notes

- **Encoding**: UTF-8
- **Format**: JSON
- **Line endings**: LF (Unix-style)
- **Indentation**: 2 spaces
- **No trailing commas**: JSON standard

## Example Translation Comparison

### English Original

```json
{
  "cards": {
    "warehouseFlow": {
      "title": "Warehouse Flow Tracking",
      "description": "Install tags on pallets, forklifts, and vehicles. A live map shows where goods are getting stuck and where vehicles idle too long. Based on Logidot's anchor sensors and wearable tags.",
      "guidance": "Use when you need to spot bottlenecks and reduce idling in warehouses or factories."
    }
  }
}
```

### Russian Translation

```json
{
  "cards": {
    "warehouseFlow": {
      "title": "Отслеживание потоков на складе",
      "description": "Установите метки на поддоны, погрузчики и транспортные средства. Карта в реальном времени показывает, где застревают товары и где техника простаивает слишком долго. Основано на якорных датчиках и носимых метках Logidot.",
      "guidance": "Используйте, когда нужно выявить узкие места и сократить простой на складах или фабриках."
    }
  }
}
```

### Latvian Translation

```json
{
  "cards": {
    "warehouseFlow": {
      "title": "Noliktavas plūsmas izsekošana",
      "description": "Uzstādiet atzīmes uz paletēm, iekrāvējiem un transportlīdzekļiem. Reāllaika karte parāda, kur preces iestrēgst un kur transportlīdzekļi stāv tukšgaitā pārāk ilgi. Balstīts uz Logidot enkura sensoriem un valkājamām atzīmēm.",
      "guidance": "Izmantojiet, kad nepieciešams identificēt šaurumus un samazināt dīkstāvi noliktavās vai rūpnīcās."
    }
  }
}
```

---

**Thank you for helping make IoT Strategy Sprint accessible to Russian and Latvian speakers!**
