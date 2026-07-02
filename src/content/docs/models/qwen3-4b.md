---
title: Qwen3-4B
description: "Running Qwen3-4B on openinfer: launch, serving performance, and architecture notes."
---

Qwen3-4B is the default openinfer model line: pure Rust + CUDA, no Python at
build time or runtime, full-attention GQA, paged KV cache, prefix caching,
CUDA Graph decode, and optional pegaflow KV offload.

## Launch

From the openinfer workspace root:

```bash
huggingface-cli download Qwen/Qwen3-4B --local-dir models/Qwen3-4B

export CUDA_HOME=/usr/local/cuda
cargo run --release
```

The default model path is `models/Qwen3-4B`, and `openinfer-server` is the
workspace default member. To pass an explicit model path or port:

```bash
cargo run --release -p openinfer-server -- \
  --model-path models/Qwen3-4B \
  --port 8000
```

The server exposes an OpenAI-compatible `/v1/completions` endpoint:

```bash
curl -s http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "The capital of France is", "max_tokens": 32}'
```

Streaming:

```bash
curl -N http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a haiku about Rust:", "max_tokens": 64, "stream": true}'
```

Useful Qwen3 flags:

```bash
# Disable CUDA Graph for debugging
cargo run --release -- --cuda-graph=false

# Pure host-tier KV offload benchmark mode
cargo run --release -- \
  --kv-offload \
  --kv-offload-host-gib 16 \
  --no-prefix-cache
```

## Performance

Measured on **1x RTX 5090 32GB**, driver 590.48.01, CUDA 13.1 build,
Qwen3-4B BF16 weights, TP1. openinfer main `0b42ed3`, vLLM 0.22.1, same
`vllm bench serve` client, same host, same GPU, prefix cache on, seed 42,
input 1024 / output 128 for the QPS sweep.

![Qwen3-4B RTX 5090 benchmark summary](/models/qwen3-4b/perf.png)

Serving load, warm prefix-cache TTFT, and KV offload numbers are in the
chart above. See the [OpenInfer 0.1.0 release post](/blog/openinfer-010/)
for methodology and discussion.

### Footprint

| Metric | openinfer | vLLM 0.22.1 |
| --- | ---: | ---: |
| RSS before stress, loaded and idle | **771 MB** | 3814 MB |
| RSS after stress | **1064 MB** | 3863 MB |
| Startup to HTTP ready, cold | **2.99 s** | 70.0 s |
| Startup, warm compile cache | **~3.0 s** | 32.7 s |
| GPU memory, default utilization | 28832 MiB | 30290 MiB |

openinfer is a single process; vLLM RSS is summed over its process tree.
The openinfer RSS peak during load is transient while reading safetensors
through `mmap`; steady-state settles at 771 MB after load.

## Architecture Notes

- Full attention with grouped-query attention: 32 query heads, 8 KV heads,
  head dim 128, 36 layers.
- Qwen3-4B and Qwen3-8B are the default pure Rust + CUDA build, with no
  Python build dependency.
- Paged KV cache uses full-lifetime admission, so requests that cannot fit
  are rejected instead of hanging under memory pressure.
- Prefix cache is on by default; `--no-prefix-cache` disables GPU prefix
  matching, or becomes pure-L2 host restore mode when combined with
  `--kv-offload`.
- CUDA Graph decode uses pre-allocated buffers and can be disabled with
  `--cuda-graph=false` for debugging.
