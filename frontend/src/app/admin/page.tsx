"use client";

import { useEffect, useState } from "react";

type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
};

type AINewsStatus = 'idle' | 'loading' | 'success' | 'error';

type PostForm = {
  slug?: string;
  title: string;
  date: string;
  description: string;
  thumbnail: string;
  body: string;
};

export default function AdminPage() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiNewsStatus, setAiNewsStatus] = useState<AINewsStatus>('idle');
  const [aiNewsMessage, setAiNewsMessage] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm>({
    title: "",
    date: new Date().toISOString().slice(0, 16),
    description: "",
    thumbnail: "/images/uploads/placeholder.webp",
    body: "",
  });

  // Generate AI News
  const generateAINews = async () => {
    try {
      setAiNewsStatus('loading');
      setAiNewsMessage(null);

      const response = await fetch('/api/news-generator', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar notícias');
      }

      setAiNewsStatus('success');
      setAiNewsMessage(`✅ ${data.generated} notícias geradas com sucesso!`);
    } catch (err: any) {
      setAiNewsStatus('error');
      setAiNewsMessage(`❌ ${err.message || 'Erro ao gerar notícias'}`);
    }
  };

  // Ocultar o footer na página admin
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      (footer as HTMLElement).style.display = "none";
    }
    return () => {
      if (footer) {
        (footer as HTMLElement).style.display = "";
      }
    };
  }, []);


  const loadPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/posts");
      if (!res.ok) throw new Error("Failed to load posts");
      const data = await res.json();
      setPosts(data);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const selectPost = async (slug: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/posts/${slug}`);
      if (!res.ok) throw new Error("Failed to load post");
      const data = await res.json();
      setForm({
        slug: data.slug,
        title: data.title || "",
        date: (data.date || new Date().toISOString()).slice(0, 16),
        description: data.description || "",
        thumbnail: data.thumbnail || "/images/uploads/placeholder.webp",
        body: data.body || "",
      });
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const newPost = () => {
    setForm({
      slug: undefined,
      title: "",
      date: new Date().toISOString().slice(0, 16),
      description: "",
      thumbnail: "/images/uploads/placeholder.webp",
      body: "",
    });
  };

  const savePost = async () => {
    try {
      setSaving(true);
      setError(null);

      const method = form.slug ? "PUT" : "POST";
      const url = form.slug ? `/api/admin/posts/${form.slug}` : "/api/admin/posts";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: new Date(form.date).toISOString(),
          description: form.description,
          thumbnail: form.thumbnail,
          body: form.body,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save post");
      }

      await loadPosts();
      const saved = await res.json();
      if (saved.slug) {
        await selectPost(saved.slug);
      }
      setInfo("Notícia salva com sucesso. Atualize a página pública para ver o resultado.");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Falha ao enviar imagem");
      }

      const json = await res.json();
      const url = json.url as string;

      setForm((f) => ({
        ...f,
        body: `${f.body}\n\n![Descrição da imagem](${url})\n`,
        thumbnail: f.thumbnail === "/images/uploads/placeholder.webp" ? url : f.thumbnail,
      }));

      setInfo("Imagem enviada e inserida no texto.");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Falha ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar de posts */}
      <div className="admin-sidebar">
        <h1 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Notícias</h1>
        <button
          onClick={newPost}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: "12px",
          }}
        >
          + Nova Notícia
        </button>

        {/* Flash Reports Generator */}
        <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#ecfdf5", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, marginBottom: "8px", color: "#047857" }}>📊 Flash Reports</p>
          <button
            onClick={generateAINews}
            disabled={aiNewsStatus === 'loading'}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: aiNewsStatus === 'loading' ? "#86efac" : "#059669",
              color: "white",
              fontWeight: 500,
              cursor: aiNewsStatus === 'loading' ? "default" : "pointer",
              fontSize: "13px",
            }}
          >
            {aiNewsStatus === 'loading' ? "⏳ Gerando..." : "Gerar Flash Reports"}
          </button>
          {aiNewsMessage && (
            <p style={{ fontSize: "11px", marginTop: "6px", color: aiNewsStatus === 'error' ? "#b91c1c" : "#166534" }}>
              {aiNewsMessage}
            </p>
          )}
        </div>


        {loading && <p style={{ fontSize: "12px" }}>Carregando...</p>}
        {!loading && posts.length === 0 && (
          <p style={{ fontSize: "12px", color: "#6b7280" }}>Nenhuma notícia ainda.</p>
        )}
        <div style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto", marginTop: "8px" }}>
          {posts.map((post) => (
            <button
              key={post.slug}
              onClick={() => selectPost(post.slug)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                marginBottom: "6px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                backgroundColor: form.slug === post.slug ? "#eff6ff" : "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600 }}>{post.title}</div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                {new Date(post.date).toLocaleDateString("pt-BR")}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Formulário */}
      <div className="admin-main">
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>
          {form.slug ? "Editar Notícia" : "Nova Notícia"}
        </h2>

        {error && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "6px",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}
        {info && !error && (
          <div
            style={{
              marginBottom: "12px",
              padding: "8px 10px",
              borderRadius: "6px",
              backgroundColor: "#ecfdf5",
              color: "#166534",
              fontSize: "13px",
            }}
          >
            {info}
          </div>
        )}

        <div style={{ display: "grid", gap: "12px" }}>
          <label style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            Título
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
              }}
              placeholder="Ex: Minha análise sobre IPCA"
            />
          </label>

          <label style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            Data de publicação
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
              }}
            />
          </label>

          <label style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            Imagem de capa (URL)
            <input
              value={form.thumbnail}
              onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
              }}
              placeholder="/images/uploads/minha-imagem.webp"
            />
          </label>

          <label style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            Resumo (aparece no card)
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
              placeholder="Resumo curto da notícia..."
            />
          </label>

          <label style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "4px" }}>
            Corpo da notícia
            <div style={{ display: "flex", gap: "8px", marginBottom: "6px", flexWrap: "wrap", alignItems: "center" }}>
              <label
                style={{
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: "11px",
                  cursor: uploading ? "default" : "pointer",
                }}
              >
                {uploading ? "Enviando imagem..." : "Upload de imagem"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handleUploadImage(file);
                      e.target.value = "";
                    }
                  }}
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    body: `${f.body}\n\n![Descrição da imagem](/images/uploads/minha-imagem.webp)\n`,
                  }))
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                + Imagem no texto
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    body: `${f.body}\n\n$E = mc^2$\n`,
                  }))
                }
                style={{
                  padding: "4px 8px",
                  borderRadius: "999px",
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                + Equação simples
              </button>
              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                Dica: use <code>![alt](/images/...)</code> para imagens e <code>$a^2+b^2$</code> para
                equações.
              </span>
            </div>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={12}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                resize: "vertical",
                fontFamily: "monospace",
                fontSize: "13px",
              }}
              placeholder="Escreva aqui o texto da notícia..."
            />
          </label>
        </div>

        <button
          onClick={savePost}
          disabled={saving || !form.title || !form.description}
          style={{
            marginTop: "16px",
            padding: "10px 16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: saving ? "#93c5fd" : "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Salvando..." : "Salvar notícia"}
        </button>
      </div>
    </div>
  );
}


