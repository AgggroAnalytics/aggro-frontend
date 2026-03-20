# ML Input/Output in Field Workflow

Этот документ для ML-инженера: что именно получает ML-активити, что возвращает, и как это дальше сохраняется в БД.

## 1) Где ML вызывается в workflow

ML вызывается в `FieldProcessingWorkflow` батчами, отдельно по каждому модулю (`m0`, `m1`, `m2`).

- Для каждого тайла собирается его `timeseries`.
- Для каждого модуля отправляется `MlBatchRequestDTO`.
- Результаты из всех модулей объединяются в единый `ml_results_list`.

Источник:

- `aggro-field-worker/temporal/workflows.py`
- `aggro-field-worker/temporal/activities.py` (`run_ml_analytics_batch`)

## 2) Вход в ML (текущий контракт)

ML получает батч одного модуля:

```json
{
  "module": "m1",
  "field_id": "uuid",
  "tile_timeseries": [
    {
      "tile_id": "uuid",
      "timeseries": [
        {
          "tile_id": "uuid",
          "date": "2026-03-01",
          "ndvi": 0.61,
          "ndmi": 0.29,
          "ndre": 0.34,
          "gndvi": 0.48,
          "msavi": 0.36,
          "nbr2": 0.22,
          "bare_soil_index": 0.11,
          "valid_pixel_ratio": 0.93,
          "vv": -12.3,
          "vh": -18.2,
          "precipitation_mm_7d": 8.4,
          "precipitation_mm_3d": 2.1,
          "precipitation_mm_30d": 21.7,
          "temperature_c_mean": 14.2,
          "dry_days": 3
        }
      ]
    }
  ]
}
```

Ключевой момент: вход содержит **весь ряд дат для тайла**.

## 3) Выход ML (текущий контракт)

Выход батча: `MlBatchResponseDTO`, внутри `results[]` по одному объекту на тайл.

Пример одного элемента `results[]`:

```json
{
  "module": "m1",
  "field_id": "uuid",
  "tile_id": "uuid",
  "health_score": 67,
  "stress_score_total": 42,
  "stress_scores": {
    "water_stress": 51,
    "vegetation_activity_drop": 33,
    "heterogeneity_growth": 20
  },
  "trend": "stable",
  "alert_level": "low",
  "explanations": []
}
```

Важно: в `MlWorkerResponseDTO` **нет `date`**.  
То есть модель сейчас схлопывает ряд `timeseries[]` в один итоговый набор скоров на тайл.