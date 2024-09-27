require 'http'

class PromptsController < ApplicationController
  def create
    @chat_thread = ChatThread.find(params[:chat_thread_id])
    @prompt = @chat_thread.prompts.build(prompt_params)
  
    context = @chat_thread.context || ""
    full_prompt = context + "\n" + @prompt.content
    
    response = openai_api_call(full_prompt)
  
    if response.status.success?
      response_body = JSON.parse(response.body.to_s)
      @prompt.response = response_body['choices'][0]['message']['content']
  
      if @chat_thread.prompts.count == 0
        generated_title = generate_title(@prompt.content)
        @chat_thread.update(title: generated_title)
      end
      
      if @prompt.save
        @chat_thread.update_context(@prompt.content + "\n" + @prompt.response)
        render json: { 
          text: @prompt.response,  # 'prompt' から 'text' に変更
          thread_title: @chat_thread.title,
          # prompt_id: @prompt.id  # プロンプトのIDも含める（必要に応じて）
        }
      else
        render json: { error: @prompt.errors.full_messages.join(', ') }, status: :unprocessable_entity
      end
    else
      render json: { error: 'Failed to get response from AI' }, status: :service_unavailable
    end
  end

  private

  def prompt_params
    params.require(:prompt).permit(:content)
  end

  def openai_api_call(prompt)
    response = HTTP.post(
      'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type' => 'application/json',
        'Authorization' => "Bearer #{ENV['OPENAI_API_KEY']}"
      },
      json: {
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      }
    )

    if response.status.success?
      response
    else
      raise "APIリクエストが失敗しました: #{response.status}"
    end
  end

  def generate_title(content)
    title_prompt = "以下の会話の開始プロンプトから、この会話スレッドの内容を予測し、5単語以内の簡潔なタイトルを生成してください。タイトルは今後の会話も含めてスレッドの内容を想像できるものにしてください。\n\nプロンプト: #{content}\n\nタイトル:"
    
    response = openai_api_call(title_prompt)
    if response.status.success?
      response_body = JSON.parse(response.body.to_s)
      generated_title = response_body['choices'][0]['message']['content'].strip
      return generated_title
    else
      return "新しい会話スレッド"
    end
  end
end