# Sandbox where the agent's commands run (build, tests, lint) over a task worktree.
# Security rules (see section 9 of the spec):
#   - run with `--network none`, no secrets in the environment;
#   - mount only the task worktree at /workspace;
#   - model calls never happen here, only in the harness process.
FROM node:24-bookworm-slim

ARG PNPM_VERSION=10.34.6

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@${PNPM_VERSION} --activate

# Unprivileged user; the worktree is mounted with its uid.
RUN useradd --create-home --uid 10001 sandbox
USER sandbox

ENV CI=true \
    TZ=UTC \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

WORKDIR /workspace
CMD ["bash"]
