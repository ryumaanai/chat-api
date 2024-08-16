class ChatThreadsController < ApplicationController
  def index
    @chat_threads = ChatThread.order(created_at: :desc)
    render json: { chat_threads: @chat_threads }
  end

  def show
    @chat_thread = ChatThread.find(params[:id])
    render json: { prompts: @chat_thread.prompts }
  end

  def create
    @chat_thread = ChatThread.create(title: 'Untitled')
    if @chat_thread.persisted?
      render json: { chat_thread: @chat_thread }, status: :created
    else
      render json: { errors: @chat_thread.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @chat_thread = ChatThread.find(params[:id])
    if @chat_thread.update(chat_thread_params)
      render json: { chat_thread: @chat_thread }
    else
      render json: { errors: @chat_thread.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def chat_thread_params
    params.require(:chat_thread).permit(:title)
  end
end