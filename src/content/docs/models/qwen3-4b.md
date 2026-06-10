---
title: Qwen3-4B
description: Running Qwen3-4B on openinfer — launch, performance, and architecture notes.
---

Qwen3-4B is the most mature model line in openinfer and the reference
implementation for the engine's full-attention path: paged KV cache,
CUDA-graph decode, FlashInfer attention with a split-K decode path for
long contexts, and prefix caching enabled by default.

## Launch

```bash
huggingface-cli download Qwen/Qwen3-4B --local-dir models/Qwen3-4B

cargo run --release -- --model-path models/Qwen3-4B
```

The Qwen3 crate is always built — no feature flags needed. The server
listens on port 8000 and serves the OpenAI-compatible `/v1/completions`
endpoint:

```bash
curl -s http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "The capital of France is", "max_tokens": 32}'
```

## Performance

Measured on a single **RTX 5090**, BF16 weights, CUDA Graph enabled,
single request.

Serving latency for a 4096-token prompt generating 64 tokens:

| Metric | p50 |
| --- | ---: |
| TTFT (time to first token) | 177 ms |
| Steady TPOT (time per output token) | 6.46 ms (~155 tok/s) |
| End-to-end | 585 ms |

### Flat decode latency across context lengths

Decode attention uses a split-K (partition-KV) FlashInfer path at low batch
sizes, so per-token latency stays nearly flat as the context grows instead
of scaling linearly with KV length:

| Context length | Decode TPOT p50 |
| ---: | ---: |
| 1,024 | 6.40 ms |
| 4,096 | 6.53 ms |
| 10,000 | 7.04 ms |

Without the split-K path, the same 10,000-token context decodes at ~20 ms
per token — the split-K kernel reaches ~98% of the RTX 5090's theoretical
memory bandwidth on the KV read.

### Prefix caching

Prefix caching is on by default. Repeated prompts skip prefill for every
fully cached KV block and only compute the suffix. For a repeated
~1,900-token prompt:

| | TTFT p50 |
| --- | ---: |
| Cold (first request) | 141.8 ms |
| Warm (cached prefix) | 16.3 ms |

That is an **8.7× TTFT reduction**; warm TTFT is essentially one decode
step plus setup overhead.

## Architecture notes

- **Full attention** with grouped-query attention: 32 query heads, 8 KV
  heads, head dim 128, 36 layers.
- **Paged KV cache** with full-lifetime KV admission: requests that cannot
  ever fit are rejected up front instead of hanging under memory pressure.
- **CUDA-graph decode** with pre-allocated buffers; graphs are captured per
  batch bucket and attention path, so a request can cross the split-K
  threshold mid-stream without breaking pointer stability.
- **Accuracy gate**: every change is validated against stored HuggingFace
  bf16 logits goldens — 48 teacher-forced sequences replayed across
  single-request, batched eager, and CUDA-graph execution.
- Qwen3-8B runs on the same engine.
