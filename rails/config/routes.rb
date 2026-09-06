Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  get "healthz" => "probe#healthz"
  root "probe#index"
end
