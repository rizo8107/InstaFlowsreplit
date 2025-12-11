import axios from "axios";

const GRAPH_API_BASE = "https://graph.instagram.com/v24.0";

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

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: string;
  media_product_type?: string;
  media_url?: string;
  permalink?: string;
  thumbnail_url?: string;
  timestamp?: string;
  username?: string;
}

export class InstagramAPI {
  private accessToken: string;
  private instagramUserId: string;
  private pageId?: string;
  private pageAccessToken?: string;

  constructor(accessToken: string, instagramUserId?: string, pageId?: string, pageAccessToken?: string) {
    this.accessToken = accessToken;
    this.instagramUserId = instagramUserId || "";
    this.pageId = pageId;
    this.pageAccessToken = pageAccessToken;
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

  async deleteComment(commentId: string): Promise<any> {
    try {
      console.log(`[InstagramAPI] Deleting comment ${commentId}`);

      const response = await axios.delete(`${GRAPH_API_BASE}/${commentId}`, {
        params: {
          access_token: this.accessToken,
        },
      });
      console.log(`[InstagramAPI] Comment deleted successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error deleting comment:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);

      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async hideComment(commentId: string): Promise<any> {
    try {
      console.log(`[InstagramAPI] Hiding comment ${commentId}`);

      const response = await axios.post(
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
      console.log(`[InstagramAPI] Comment hidden successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error hiding comment:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);

      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async getMedia(mediaId: string): Promise<InstagramMedia> {
    try {
      console.log(`[InstagramAPI] Fetching media ${mediaId}`);

      const response = await axios.get(`${GRAPH_API_BASE}/${mediaId}`, {
        params: {
          access_token: this.accessToken,
          fields: "id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,username",
        },
      });
      console.log(`[InstagramAPI] Media fetched successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error fetching media:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);

      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async getUserMedia(limit: number = 25): Promise<{ data: InstagramMedia[] }> {
    try {
      console.log(`[InstagramAPI] Fetching user media (limit: ${limit})`);

      const response = await axios.get(`${GRAPH_API_BASE}/${this.instagramUserId}/media`, {
        params: {
          access_token: this.accessToken,
          fields: "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username",
          limit,
        },
      });
      console.log(`[InstagramAPI] Fetched ${response.data.data.length} media items`);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error fetching user media:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);

      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async likeComment(commentId: string): Promise<any> {
    try {
      console.log(`[InstagramAPI] Liking comment ${commentId}`);

      const response = await axios.post(
        `${GRAPH_API_BASE}/${commentId}/likes`,
        {},
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );
      console.log(`[InstagramAPI] Comment liked successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error liking comment:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);

      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  // Direct Messages
  async sendDirectMessage(recipientId: string, message: string): Promise<any> {
    try {
      // Use Instagram Graph API v24.0 format: /<IG_ID>/messages with recipient.id
      const endpoint = `${GRAPH_API_BASE}/${this.instagramUserId}/messages`;

      const requestBody = {
        recipient: { id: recipientId },
        message: { text: message }
      };

      console.log(`[InstagramAPI] Sending DM to recipient ${recipientId} via ${endpoint}`);
      console.log(`[InstagramAPI] Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        endpoint,
        requestBody,
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

  async sendButtonTemplate(
    recipientId: string,
    title: string,
    subtitle: string | undefined,
    buttons: Array<{ type: 'web_url' | 'postback', title: string, url?: string, payload?: string }>
  ): Promise<any> {
    try {
      const endpoint = `${GRAPH_API_BASE}/${this.instagramUserId}/messages`;

      const requestBody = {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [
                {
                  title: title,
                  ...(subtitle && { subtitle: subtitle }),
                  buttons: buttons.map(btn => ({
                    type: btn.type,
                    title: btn.title,
                    ...(btn.type === 'web_url' && btn.url && { url: btn.url }),
                    ...(btn.type === 'postback' && btn.payload && { payload: btn.payload })
                  }))
                }
              ]
            }
          }
        }
      };

      console.log(`[InstagramAPI] Sending button template to recipient ${recipientId}`);
      console.log(`[InstagramAPI] Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        endpoint,
        requestBody,
        {
          params: {
            access_token: this.accessToken,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`[InstagramAPI] Button template sent successfully:`, response.data);
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown Instagram API error';
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error sending button template:`, errorDetails);
      console.error(`[InstagramAPI] Full error:`, error);

      throw new Error(`Instagram API Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  // Private Reply (Messenger Platform - used for comment-triggered DMs)
  async sendPrivateReply(commentId: string, message: string): Promise<any> {
    try {
      // Use Instagram Graph API endpoint first (as per Meta documentation)
      // POST /{ig-user-id}/messages with { recipient: { comment_id }, message: { text } }
      const igEndpoint = `${GRAPH_API_BASE}/${this.instagramUserId}/messages`;
      const igRequestBody = {
        recipient: { comment_id: commentId },
        message: { text: message },
      };

      console.log(`[InstagramAPI] Sending Private Reply via IG endpoint from comment ${commentId}`);
      console.log(`[InstagramAPI] Request body:`, JSON.stringify(igRequestBody, null, 2));

      const igResponse = await axios.post(
        igEndpoint,
        igRequestBody,
        {
          params: {
            access_token: this.accessToken,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`[InstagramAPI] Private Reply (IG endpoint) sent successfully:`, igResponse.data);
      return igResponse.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown API error';
      const errorCode = errorData?.error?.code;
      const errorSubcode = errorData?.error?.error_subcode;
      const errorDetails = JSON.stringify(errorData || error.message);

      console.error(`[InstagramAPI] Error sending Private Reply via IG endpoint:`, errorDetails);

      // If IG endpoint fails, try Page endpoint as fallback
      if (this.pageId && this.pageAccessToken) {
        console.log(`[InstagramAPI] Retrying with Page endpoint...`);
        try {
          const endpoint = `https://graph.facebook.com/v24.0/${this.pageId}/messages`;
          const requestBody = {
            recipient: { comment_id: commentId },
            message: { text: message },
            messaging_type: "RESPONSE",
          };

          console.log(`[InstagramAPI] Sending Private Reply via Page endpoint from comment ${commentId}`);
          console.log(`[InstagramAPI] Request body:`, JSON.stringify(requestBody, null, 2));

          const response = await axios.post(
            endpoint,
            requestBody,
            {
              params: {
                access_token: this.pageAccessToken,
              },
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          console.log(`[InstagramAPI] Private Reply (Page endpoint) sent successfully:`, response.data);
          return response.data;
        } catch (pageError: any) {
          console.error(`[InstagramAPI] Page endpoint also failed:`, pageError.response?.data || pageError.message);
        }
      }

      // Error subcode 2534001: Thread owner has archived/deleted conversation or thread doesn't exist
      if (errorSubcode === 2534001) {
        throw new Error(`Private Reply failed: The conversation thread doesn't exist, was deleted, or was archived by the user. This can happen if: (1) the comment was deleted, (2) the user archived the conversation, or (3) trying to use Private Reply when a normal DM should be used instead. Error code: ${errorCode}, subcode: ${errorSubcode}`);
      }

      throw new Error(`Private Reply Error: ${errorMessage} - Details: ${errorDetails}`);
    }
  }

  async getConversations(): Promise<any> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me/conversations`,
      {
        params: {
          access_token: this.accessToken,
          platform: "instagram",
          fields: "id,participants,messages{id,from,created_time,message}",
        },
      }
    );
    return response.data;
  }

  async getConversationIdBySenderId(senderId: string): Promise<string | null> {
    try {
      console.log(`[InstagramAPI] Fetching conversation for sender ${senderId}`);

      const conversations = await this.getConversations();

      // Find conversation with this sender as a participant
      if (conversations.data && Array.isArray(conversations.data)) {
        for (const conv of conversations.data) {
          if (conv.participants && conv.participants.data) {
            const hasSender = conv.participants.data.some((p: any) => p.id === senderId);
            if (hasSender) {
              console.log(`[InstagramAPI] Found conversation ${conv.id} for sender ${senderId}`);
              return conv.id;
            }
          }
        }
      }

      console.log(`[InstagramAPI] No conversation found for sender ${senderId}`);
      return null;
    } catch (error: any) {
      console.error(`[InstagramAPI] Error fetching conversation:`, error);
      return null;
    }
  }

  // Media
  async isReel(mediaId: string): Promise<boolean> {
    try {
      const media = await this.getMedia(mediaId);
      // Reels are identified by media_product_type = "REELS" or media_type = "VIDEO" with product type REELS
      return media.media_product_type === 'REELS' ||
        (media.media_type === 'VIDEO' && media.media_product_type === 'REELS');
    } catch (error) {
      console.error(`[InstagramAPI] Error checking if media is Reel:`, error);
      return false;
    }
  }

  async getRecentMedia(limit: number = 10): Promise<any> {
    const response = await axios.get(
      `${GRAPH_API_BASE}/me/media`,
      {
        params: {
          access_token: this.accessToken,
          fields: "id,caption,media_type,media_product_type,media_url,permalink,timestamp,username",
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

  // Webhook Subscription Management
  /**
   * Subscribe Instagram account to webhook fields
   * @param appId - Facebook App ID
   * @param callbackUrl - Webhook callback URL
   * @param verifyToken - Webhook verify token
   * @param fields - Array of webhook fields to subscribe (default: comments,messages,mentions,story_insights)
   */
  async subscribeToWebhooks(
    appId: string,
    callbackUrl: string,
    verifyToken: string,
    fields: string[] = ['comments', 'messages', 'mentions', 'story_insights']
  ): Promise<{ success: boolean; subscribedFields: string[]; errors: string[] }> {
    const results: { success: boolean; subscribedFields: string[]; errors: string[] } = {
      success: true,
      subscribedFields: [],
      errors: []
    };

    console.log(`[InstagramAPI] Subscribing Instagram account ${this.instagramUserId} to webhooks`);
    console.log(`[InstagramAPI] Fields: ${fields.join(', ')}`);
    console.log(`[InstagramAPI] Callback URL: ${callbackUrl}`);

    // Subscribe to each field individually
    for (const field of fields) {
      try {
        const endpoint = `https://graph.facebook.com/v24.0/${this.instagramUserId}/subscribed_apps`;

        const response = await axios.post(
          endpoint,
          {
            subscribed_fields: field,
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

        console.log(`[InstagramAPI] Successfully subscribed to ${field}:`, response.data);
        results.subscribedFields.push(field);
      } catch (error: any) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || error.message || 'Unknown error';
        const errorDetails = JSON.stringify(errorData || error.message);

        console.error(`[InstagramAPI] Failed to subscribe to ${field}:`, errorDetails);
        results.errors.push(`${field}: ${errorMessage}`);
        results.success = false;
      }
    }

    // Also subscribe the app to Instagram object webhooks
    try {
      const appEndpoint = `https://graph.facebook.com/v24.0/${appId}/subscriptions`;

      const appResponse = await axios.post(
        appEndpoint,
        {
          object: 'instagram',
          callback_url: callbackUrl,
          verify_token: verifyToken,
          fields: fields.join(','),
        },
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      console.log(`[InstagramAPI] App subscribed to Instagram webhooks:`, appResponse.data);
    } catch (error: any) {
      // This might fail if webhook is already configured - not critical
      console.warn(`[InstagramAPI] App webhook subscription warning:`, error.response?.data || error.message);
    }

    return results;
  }

  /**
   * Unsubscribe Instagram account from webhook fields
   */
  async unsubscribeFromWebhooks(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`[InstagramAPI] Unsubscribing Instagram account ${this.instagramUserId} from webhooks`);

      const endpoint = `https://graph.facebook.com/v24.0/${this.instagramUserId}/subscribed_apps`;

      const response = await axios.delete(endpoint, {
        params: {
          access_token: this.accessToken,
        },
      });

      console.log(`[InstagramAPI] Successfully unsubscribed from webhooks:`, response.data);
      return { success: true, message: 'Unsubscribed successfully' };
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || error.message || 'Unknown error';

      console.error(`[InstagramAPI] Failed to unsubscribe from webhooks:`, errorData || error.message);
      return { success: false, message: errorMessage };
    }
  }

  /**
   * Check current webhook subscriptions for this Instagram account
   */
  async getWebhookSubscriptions(): Promise<{ subscriptions: string[]; error?: string }> {
    try {
      const endpoint = `https://graph.facebook.com/v24.0/${this.instagramUserId}/subscribed_apps`;

      const response = await axios.get(endpoint, {
        params: {
          access_token: this.accessToken,
        },
      });

      const subscriptions = response.data?.data || [];
      const subscribedFields = subscriptions.flatMap((sub: any) =>
        sub.subscribed_fields || []
      );

      console.log(`[InstagramAPI] Current webhook subscriptions:`, subscribedFields);
      return { subscriptions: subscribedFields };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      console.error(`[InstagramAPI] Failed to get webhook subscriptions:`, error.response?.data || error.message);
      return { subscriptions: [], error: errorMessage };
    }
  }
}
