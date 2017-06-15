<xsl:stylesheet version="1.0" 
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:dp="http://www.datapower.com/extensions" 
	extension-element-prefixes="dp" exclude-result-prefixes="dp">


  <!-- the dir _common is pre-populated -->
  <xsl:import href="local:///apis/_common/xml-to-json.xsl"/>
  <xsl:template match="/">
    <dp:set-http-response-header name="'add-header-by'" value="'set-http-response-header'"/>

    <dp:set-variable name="'var://service/set-response-header/Content-Type'" value="'application/json'" />
    <xsl:call-template name="everything"/>
  </xsl:template>

</xsl:stylesheet>