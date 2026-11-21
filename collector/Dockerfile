FROM denoland/deno:alpine
WORKDIR /app
COPY main.ts .
RUN deno cache main.ts
USER deno
EXPOSE 8000
CMD ["deno", "run", "--allow-net", "--allow-env", "main.ts"]
