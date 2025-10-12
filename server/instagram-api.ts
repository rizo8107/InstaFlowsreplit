import axios from "axios";

const GRAPH_API_BASE = "https://graph.instagram.com";

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  from: {
    id: string;
    username: string;
  };
  media: {
    id: string;
  };
}

export interface InstagramMessage {
  id: string;
  text: string;
  from: {
    id: string;
    username: string;
  };
  created_time: string;
}

export class InstagramAPI {
  private accessToken: string;
  private instagramUserId: string;

  constructor(accessToken: string, instagramUserId?: string) {
    this.accessToken = accessToken;
    this.instagramUserId = instagramUserId || "";
  }

  // Comments
  async getComment(commentId: string): Promise<InstagramComment> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/${commentId}`,
      {
        params: {
          access_token: this.accessToken,
          fields: "id,text,username,timestamp,from,media",
        },
      }
    );
    return response.data;
  }

  async replyToComment(commentId: string, message: string): Promise<any> {
    try {
      console.log(`[InstagramAPI] Replying to comment ${commentId} with message: ${message}`);
      
      const response = await axios.post(
        `${GRAPH_API_BASE}/${commentId}/replies`,
        {
          message,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );
      console.log(`[InstagramAPI] Reply sent successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);
      
      console.error(`[InstagramAPI] Error replying to comment:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);
      
      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      await axios.delete(`${GRAPH_API_BASE}/${commentId}`, {
        params: {
          access_token: this.accessToken,
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async hideComment(commentId: string): Promise<boolean> {
    try {
      await axios.post(
        `${GRAPH_API_BASE}/${commentId}`,
        {
          hide: true,
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async likeComment(commentId: string): Promise<boolean> {
    try {
      await axios.post(
        `${GRAPH_API_BASE}/${commentId}/likes`,
        {},
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Direct Messages
  async sendDirectMessage(conversationId: string, message: string): Promise<any> {
    try {
      // Use conversation ID endpoint as per Instagram Graph API docs
      const endpoint = `${GRAPH_API_BASE}/${conversationId}/messages`;
      
      console.log(`[InstagramAPI] Sending DM to conversation ${conversationId} via ${endpoint}`);
      console.log(`[InstagramAPI] Request body:`, JSON.stringify({
        message: { text: message },
      }));
      
      const response = await axios.post(
        endpoint,
        {
          message: { text: message },
        },
        {
          params: {
            access_token: this.accessToken,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`[InstagramAPI] DM sent successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);
      
      console.error(`[InstagramAPI] Error sending DM:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);
      
      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async getConversations(): Promise<any> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me/conversations`,
      {
        params: {
          access_token: this.accessToken,
          fields: "id,messages{id,from,created_time,message}",
        },
      }
    );
    return response.data;
  }

  // Media
  async getMedia(mediaId: string): Promise<any> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/${mediaId}`,
      {
        params: {
          access_token: this.accessToken,
          fields: "id,caption,media_type,media_url,permalink,timestamp,username",
        },
      }
    );
    return response.data;
  }

  async getRecentMedia(limit: number = 10): Promise<any> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me/media`,
      {
        params: {
          access_token: this.accessToken,
          fields: "id,caption,media_type,media_url,permalink,timestamp,username",
          limit,
        },
      }
    );
    return response.data;
  }

  // User Info
  async getUserInfo(): Promise<any> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me`,
      {
        params: {
          access_token: this.accessToken,
          fields: "id,username,account_type,media_count",
        },
      }
    );
    return response.data;
  }
}
