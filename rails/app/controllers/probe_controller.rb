class ProbeController < ActionController::API
  def index
    render html: '<h1 id="probe-marker">RAILS_LIVE</h1>'.html_safe, content_type: "text/html"
  end

  def healthz
    render json: { ok: true, framework: "rails", port: ENV["PORT"] }
  end
end
