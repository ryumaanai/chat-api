Rails.application.routes.draw do
  root 'chat_threads#index'
  resources :chat_threads, only: [:index, :show, :create, :update] do
    resources :prompts, only: [:create]
  end
end
