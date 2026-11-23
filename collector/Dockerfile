FROM denoland/deno:alpine
RUN apk add --no-cache curl
WORKDIR /app
COPY main.ts .
RUN chmod 644 main.ts && deno cache main.ts
USER deno
EXPOSE 8000
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-run=curl", "--allow-write=/tmp", "main.ts"]
